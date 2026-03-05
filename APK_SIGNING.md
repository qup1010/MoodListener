# APK signing setup

## 1) Create release keystore (local)

```powershell
keytool -genkeypair -v -keystore moodlistener-release.jks -alias moodlistener -keyalg RSA -keysize 2048 -validity 10000
```

## 2) Local build (signed release APK)

Set environment variables in your current shell before running Gradle:

```powershell
$env:MOODLISTENER_UPLOAD_STORE_FILE = "D:\path\to\moodlistener-release.jks"
$env:MOODLISTENER_UPLOAD_STORE_PASSWORD = "<store-password>"
$env:MOODLISTENER_UPLOAD_KEY_ALIAS = "moodlistener"
$env:MOODLISTENER_UPLOAD_KEY_PASSWORD = "<key-password>"
```

Then build:

```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleRelease
```

Output:

`android/app/build/outputs/apk/release/app-release.apk`

## 3) GitHub Actions secrets

Add these repository secrets:

- `MOODLISTENER_UPLOAD_KEYSTORE_BASE64`
- `MOODLISTENER_UPLOAD_STORE_PASSWORD`
- `MOODLISTENER_UPLOAD_KEY_ALIAS`
- `MOODLISTENER_UPLOAD_KEY_PASSWORD`

Generate base64 from keystore locally:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("D:\path\to\moodlistener-release.jks"))
```

## 4) CI build and release

Workflow file: `.github/workflows/build-signed-apk.yml`

- Manual build: run `Build Signed APK` from the Actions page.
- Auto release: push a tag like `v1.0.0`, workflow will:
  - build signed release APK
  - upload artifact
  - create GitHub Release and attach `app-release.apk`

Tag command example:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

