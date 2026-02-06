# Mobile Authentication Guide
## iOS App Authentication with Google Sign-In

This guide explains how to authenticate your iOS app with the RVU Tracker backend using Google Sign-In.

---

## Overview

The backend now supports **mobile app authentication** using Google ID tokens. The flow works as follows:

1. User signs in with Google Sign-In SDK in iOS app
2. iOS app receives Google ID token
3. iOS app sends ID token to backend `/api/auth/mobile/google`
4. Backend verifies token, creates/updates user, returns session JWT
5. iOS app stores JWT and includes it in all subsequent API requests

---

## Backend Implementation

### Endpoint

**POST** `/api/auth/mobile/google`

Authenticates mobile users by verifying Google ID tokens.

### Request

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Headers:**
```
Content-Type: application/json
```

### Response (200 OK)

```json
{
  "success": true,
  "user": {
    "id": "117584285732048297471",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://lh3.googleusercontent.com/..."
  },
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 2592000
}
```

**Fields:**
- `sessionToken` - JWT token for subsequent API requests (30-day expiration)
- `expiresIn` - Token lifetime in seconds (2,592,000 = 30 days)
- `user` - User profile information

### Response Errors

**400 Bad Request:**
```json
{
  "error": "Missing idToken"
}
```

**401 Unauthorized:**
```json
{
  "error": "Invalid ID token"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to create user session"
}
```

---

## iOS Implementation

### Step 1: Install Google Sign-In SDK

Add the Google Sign-In package to your project:

**Swift Package Manager:**
```
https://github.com/google/GoogleSignIn-iOS
```

**CocoaPods:**
```ruby
pod 'GoogleSignIn'
```

### Step 2: Configure Google Sign-In

**1. Add OAuth Client ID to Info.plist:**

```xml
<key>GIDClientID</key>
<string>YOUR_IOS_CLIENT_ID</string>

<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

**2. Initialize Google Sign-In in App Delegate:**

```swift
import GoogleSignIn

@main
struct RVUTrackerApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
```

### Step 3: Implement Authentication Service

Create an `AuthService` to handle Google Sign-In and backend communication:

```swift
import Foundation
import GoogleSignIn

class AuthService: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: User?
    @Published var sessionToken: String?

    private let baseURL = URL(string: "https://trackmyrvu.com")!
    // For development: URL(string: "http://localhost:3001")!

    // MARK: - Sign In with Google

    func signInWithGoogle() async throws {
        // Get the root view controller
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            throw AuthError.noRootViewController
        }

        // Configure Google Sign-In
        let config = GIDConfiguration(clientID: "YOUR_IOS_CLIENT_ID")
        GIDSignIn.sharedInstance.configuration = config

        // Sign in
        let result = try await GIDSignIn.sharedInstance.signIn(
            withPresenting: rootViewController
        )

        // Get ID token
        guard let idToken = result.user.idToken?.tokenString else {
            throw AuthError.noIDToken
        }

        // Send to backend
        try await authenticateWithBackend(idToken: idToken)
    }

    // MARK: - Authenticate with Backend

    private func authenticateWithBackend(idToken: String) async throws {
        let url = baseURL.appendingPathComponent("/api/auth/mobile/google")

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["idToken": idToken]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw AuthError.serverError(errorResponse?.error ?? "Unknown error")
        }

        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)

        // Store session token
        DispatchQueue.main.async {
            self.sessionToken = authResponse.sessionToken
            self.user = authResponse.user
            self.isAuthenticated = true
        }

        // Save token to keychain
        try saveTokenToKeychain(authResponse.sessionToken)
    }

    // MARK: - Token Management

    private func saveTokenToKeychain(_ token: String) throws {
        let data = token.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "sessionToken",
            kSecValueData as String: data
        ]

        // Delete old token
        SecItemDelete(query as CFDictionary)

        // Add new token
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw AuthError.keychainError
        }
    }

    func loadTokenFromKeychain() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "sessionToken",
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }

        return token
    }

    func signOut() {
        // Sign out from Google
        GIDSignIn.sharedInstance.signOut()

        // Clear session
        DispatchQueue.main.async {
            self.isAuthenticated = false
            self.user = nil
            self.sessionToken = nil
        }

        // Delete token from keychain
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "sessionToken"
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Models

struct User: Codable {
    let id: String
    let email: String
    let name: String?
    let image: String?
}

struct AuthResponse: Codable {
    let success: Bool
    let user: User
    let sessionToken: String
    let expiresIn: Int
}

struct ErrorResponse: Codable {
    let error: String
}

enum AuthError: LocalizedError {
    case noRootViewController
    case noIDToken
    case invalidResponse
    case serverError(String)
    case keychainError

    var errorDescription: String? {
        switch self {
        case .noRootViewController:
            return "Could not find root view controller"
        case .noIDToken:
            return "Failed to get ID token from Google"
        case .invalidResponse:
            return "Invalid response from server"
        case .serverError(let message):
            return message
        case .keychainError:
            return "Failed to save token to keychain"
        }
    }
}
```

### Step 4: Create API Client

Create an `APIClient` that includes the JWT token in requests:

```swift
import Foundation

class APIClient {
    static let shared = APIClient()

    private let baseURL: URL
    private let session: URLSession

    init() {
        #if DEBUG
        self.baseURL = URL(string: "http://localhost:3001")!
        #else
        self.baseURL = URL(string: "https://trackmyrvu.com")!
        #endif

        let configuration = URLSessionConfiguration.default
        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Make Authenticated Request

    func makeAuthenticatedRequest(
        _ endpoint: String,
        method: String = "GET",
        body: Data? = nil
    ) async throws -> Data {
        // Get token from AuthService
        guard let token = AuthService.shared.sessionToken else {
            throw APIError.notAuthenticated
        }

        let url = baseURL.appendingPathComponent(endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        if let body = body {
            request.httpBody = body
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        // Handle 401 - token expired
        if httpResponse.statusCode == 401 {
            // Sign out user
            await MainActor.run {
                AuthService.shared.signOut()
            }
            throw APIError.tokenExpired
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(httpResponse.statusCode)
        }

        return data
    }

    // MARK: - Example: Fetch Visits

    func fetchVisits() async throws -> [Visit] {
        let data = try await makeAuthenticatedRequest("/api/visits")
        let visits = try JSONDecoder().decode([Visit].self, from: data)
        return visits
    }

    // MARK: - Example: Create Visit

    func createVisit(_ visitRequest: CreateVisitRequest) async throws -> Visit {
        let body = try JSONEncoder().encode(visitRequest)
        let data = try await makeAuthenticatedRequest(
            "/api/visits",
            method: "POST",
            body: body
        )
        let visit = try JSONDecoder().decode(Visit.self, from: data)
        return visit
    }
}

enum APIError: LocalizedError {
    case notAuthenticated
    case invalidResponse
    case httpError(Int)
    case tokenExpired

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Not authenticated. Please sign in."
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .tokenExpired:
            return "Session expired. Please sign in again."
        }
    }
}
```

### Step 5: Use in SwiftUI Views

```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var authService = AuthService()
    @State private var visits: [Visit] = []
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            if authService.isAuthenticated {
                // Main app view
                VStack {
                    Text("Welcome, \(authService.user?.name ?? "User")!")
                        .font(.title)

                    List(visits) { visit in
                        VStack(alignment: .leading) {
                            Text(visit.date)
                            Text("\(visit.totalRVU) RVU")
                                .font(.caption)
                        }
                    }

                    Button("Sign Out") {
                        authService.signOut()
                    }
                }
                .navigationTitle("RVU Tracker")
                .task {
                    await loadVisits()
                }
            } else {
                // Sign-in view
                VStack(spacing: 20) {
                    Text("RVU Tracker")
                        .font(.largeTitle)
                        .bold()

                    Button {
                        Task {
                            do {
                                try await authService.signInWithGoogle()
                            } catch {
                                errorMessage = error.localizedDescription
                            }
                        }
                    } label: {
                        HStack {
                            Image(systemName: "g.circle.fill")
                            Text("Sign in with Google")
                        }
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }

                    if let error = errorMessage {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
        }
    }

    func loadVisits() async {
        do {
            visits = try await APIClient.shared.fetchVisits()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
```

---

## Testing the Implementation

### 1. Test Authentication Endpoint (cURL)

```bash
# Get a Google ID token from your iOS app (print it in Xcode console)
# Then test the endpoint:

curl -X POST http://localhost:3001/api/auth/mobile/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_GOOGLE_ID_TOKEN_HERE"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "117584285732048297471",
    "email": "user@example.com",
    "name": "John Doe",
    "image": null
  },
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 2592000
}
```

### 2. Test API with JWT Token

```bash
# Use the session token from step 1
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Fetch visits
curl http://localhost:3001/api/visits \
  -H "Authorization: Bearer $TOKEN"

# Create visit
curl -X POST http://localhost:3001/api/visits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-26",
    "time": "14:30:00",
    "notes": "Test from iOS",
    "is_no_show": false,
    "procedures": [{
      "hcpcs": "99213",
      "description": "Office visit",
      "status_code": "A",
      "work_rvu": 1.30,
      "quantity": 1
    }]
  }'
```

---

## Security Considerations

### Token Storage
- **Use Keychain** to store JWT tokens securely
- Never store tokens in UserDefaults or files
- Clear tokens on sign-out

### Token Expiration
- Tokens expire after 30 days
- Handle 401 responses by signing out and redirecting to sign-in
- Consider implementing token refresh (future enhancement)

### HTTPS Only
- Always use HTTPS in production (`https://trackmyrvu.com`)
- HTTP is only acceptable for localhost development

### Backend Validation
- Backend verifies Google ID token with Google's servers
- Backend checks token audience matches your Client ID
- User data is stored securely in Postgres database

---

## Troubleshooting

### "Invalid ID token" Error

**Causes:**
- Token has expired (Google tokens expire quickly)
- Wrong Google Client ID configured
- Token was generated for different app/client ID

**Solution:**
- Ensure you're using the correct iOS Client ID in your app
- Request a fresh token from Google Sign-In
- Verify `GIDClientID` in Info.plist matches your OAuth client

### "Unauthorized" on API Requests

**Causes:**
- JWT token missing from request
- JWT token expired (30 days)
- JWT token malformed

**Solution:**
- Check `Authorization` header is set: `Bearer <token>`
- Sign out and sign back in to get fresh token
- Verify token is stored correctly in keychain

### Google Sign-In Not Working

**Causes:**
- OAuth client not configured in Google Cloud Console
- Redirect URI not whitelisted
- Bundle ID mismatch

**Solution:**
- Verify OAuth client is set up in Google Cloud Console
- Add iOS app to OAuth consent screen
- Ensure bundle ID matches OAuth client configuration

---

## Production Deployment

### Backend Configuration

**Environment Variables (Vercel):**
```bash
GOOGLE_CLIENT_ID=<your_ios_client_id>
AUTH_SECRET=<generated_with_openssl_rand_-base64_32>
```

### iOS App Configuration

**Update Base URL:**
```swift
// APIClient.swift
private let baseURL = URL(string: "https://trackmyrvu.com")!
```

**Update Google Client ID:**
```xml
<!-- Info.plist -->
<key>GIDClientID</key>
<string>386826311054-YOUR_PROD_CLIENT_ID</string>
```

---

## API Compatibility

All existing API endpoints now support **both authentication methods**:

1. **Web App** - NextAuth session cookies (existing)
2. **Mobile App** - JWT Bearer tokens (new)

No changes needed to existing web app code!

---

## Summary

### Authentication Flow
1. iOS app: Google Sign-In SDK → Get ID token
2. iOS app: POST ID token to `/api/auth/mobile/google`
3. Backend: Verify token with Google, create/update user, return JWT
4. iOS app: Store JWT in keychain
5. iOS app: Include JWT in `Authorization: Bearer <token>` header for all requests

### Token Lifecycle
- **Creation:** On successful Google Sign-In
- **Storage:** iOS Keychain (secure)
- **Expiration:** 30 days
- **Renewal:** Sign in again with Google

### Security
- ✅ Google verifies ID tokens server-side
- ✅ JWT tokens signed with AUTH_SECRET
- ✅ Tokens stored in secure keychain
- ✅ HTTPS only in production
- ✅ Auto sign-out on 401 responses

---

**Last Updated:** 2025-01-26
**Backend Version:** Next.js 16.0.7
**Supported iOS Version:** iOS 15.0+
