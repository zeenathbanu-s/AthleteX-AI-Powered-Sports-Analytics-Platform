package com.athletex.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.tasks.await

abstract class BaseRepository {
    
    protected val auth: FirebaseAuth = FirebaseAuth.getInstance()
    protected val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
    protected val storage: FirebaseStorage = FirebaseStorage.getInstance()
    
    protected suspend fun <T> safeCall(action: suspend () -> T): Result<T> {
        return withContext(Dispatchers.IO) {
            try {
                Result.success(action())
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }
    
    protected fun getCurrentUserId(): String? {
        return auth.currentUser?.uid
    }
    
    protected fun isUserLoggedIn(): Boolean {
        return auth.currentUser != null
    }
}
