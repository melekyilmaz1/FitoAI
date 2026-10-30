# 🔐 Auth Fix & Onboarding Sync - Implementation Plan

## 🎯 Sorunlar

### 1. Kullanıcı Giriş Yaptı Ama Auth Uyarısı Gözüküyor
- **DashboardHeader**: `user` var olmasına rağmen "Giriş Yap" butonu görünüyor
- **AuthPrompt**: Sayfa başında "Planını Kaydet 💾 / Hesap Oluştur" kartı görünüyor
- **Neden**: `authLoading` state'i kontrol edilmiyor - `loading` true iken `user` null gelir

### 2. Onboarding Planı Giriş Sonrası Otomatik Kaydedilmiyor
- Kullanıcı onboarding formunu dolduruyor → veri `localStorage` ('fito_onboarding_data') ye yazılıyor
- Sonra giriş/kayıt oluyor → bu veriler veritabanına (Supabase) eşitlenmiyor
- **Gereken**: `signUp` ve `signIn` başarılı olduğunda localStorage'daki veriyi API'ye gönderip kaydet

---

## 🛠 Çözümler

### ÇÖZÜM 1: DashboardHeader & AuthPrompt - Loading State Kontrolü

**DashboardPage.tsx** - `useAuth` hook'undan `loading` state'ini al ve render'da kullan:

```tsx
const { user, loading: authLoading, signOut } = useAuth()

// Render içinde:
if (authLoading) {
  return <LoadingSpinner /> // veya null / skeleton
}

// AuthPrompt sadece user YOKSA VE loading BİTTİYSE göster:
{!authLoading && !user && <AuthPrompt onOpenAuth={handleOpenAuth} />}
```

**DashboardHeader.tsx** - Zaten `user` prop'una bağlı doğru çalışıyor, sorun `DashboardPage`'de `loading` kontrolünün eksikliği.

---

### ÇÖZÜM 2: Onboarding Verisini Veritabanına Sync Et

#### Adım 1: API Route Oluştur - `/api/onboarding/sync/route.ts`

```typescript
// POST /api/onboarding/sync
// Body: { userId: string, formData: FormData, metrics: CalculatedMetrics }
```

#### Adım 2: AuthContext'te signUp/signIn Sonrası Sync Tetikle

**auth-context.tsx** - `signUp` ve `signIn` fonksiyonları başarılı olduğunda:

```typescript
// signUp başarılıysa:
if (data.user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
  setUser(data.user)
  // 🔥 YENİ: Onboarding verisini senkronize et
  await syncOnboardingData(data.user.id)
}

// signIn başarılıysa:
if (data.user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
  setUser(data.user)
  // 🔥 YENİ: Onboarding verisini senkronize et
  await syncOnboardingData(data.user.id)
}

// Yardımcı fonksiyon:
const syncOnboardingData = async (userId: string) => {
  const stored = localStorage.getItem("fito_onboarding_data")
  if (!stored) return
  
  try {
    const formData = JSON.parse(stored)
    const metrics = calculateMetrics(formData)
    
    await fetch("/api/onboarding/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, formData, metrics })
    })
    
    // Başarılıysa localStorage temizle (isteğe bağlı)
    // localStorage.removeItem("fito_onboarding_data")
  } catch (err) {
    console.error("Onboarding sync error:", err)
  }
}
```

#### Adım 3: Veritabanı Şeması (Supabase)

```sql
-- users tablosuna eklenecek alanlar (veya ayrı tablo)
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_data JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metrics_data JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;
```

#### Adım 4: Sync API Implementation

```typescript
// src/app/api/onboarding/sync/route.ts
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { safeParseJson } from "@/lib/utils"

export async function POST(request: Request) {
  const { userId, formData, metrics } = await request.json()
  
  if (!userId || !formData || !metrics) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  
  const { error } = await supabase
    .from("users")
    .update({
      onboarding_data: formData,
      metrics_data: metrics,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
```

---

## 📋 Yapılacak Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|------------|
| `src/app/dashboard/page.tsx` | `authLoading` kontrolü ekle, AuthPrompt conditional render |
| `src/lib/auth-context.tsx` | `signUp`/`signIn` sonrası `syncOnboardingData` çağır |
| `src/app/api/onboarding/sync/route.ts` | **YENİ** - Onboarding sync API endpoint |
| `supabase-schema.sql` | `users` tablosuna onboarding alanları ekle |

---

## ✅ Test Senaryoları

1. **Yeni kullanıcı**: Onboarding doldur → Kayıt ol → Dashboard'da auth uyarısı YOK, profil verisi VAR
2. **Mevcut kullanıcı**: Onboarding doldur → Giriş yap → Dashboard'da auth uyarısı YOK, profil verisi VAR
3. **Giriş yapmamış**: Dashboard aç → AuthPrompt GÖRÜNÜR
4. **Loading state**: Sayfa yüklenirken spinner/skeleton göster, sonra doğru UI render et