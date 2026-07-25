package com.athletex.repository

import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.tasks.await

class AuthRepository : BaseRepository() {
    
    suspend fun loginWithEmail(email: String, password: String): Result<FirebaseUser> {
        return safeCall {
            val result = auth.signInWithEmailAndPassword(email, password).await()
            result.user ?: throw Exception("Login failed: No user returned")
        }
    }
    
    suspend fun signupWithEmail(email: String, password: String): Result<FirebaseUser> {
        return safeCall {
            val result = auth.createUserWithEmailAndPassword(email, password).await()
            result.user ?: throw Exception("Signup failed: No user returned")
        }
    }
    
    fun logout() {
        auth.signOut()
    }
    
    fun getCurrentUser(): FirebaseUser? {
        return auth.currentUser
    }
}
