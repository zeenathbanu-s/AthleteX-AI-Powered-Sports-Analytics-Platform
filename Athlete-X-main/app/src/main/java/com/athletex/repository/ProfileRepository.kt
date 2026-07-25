package com.athletex.repository

import android.net.Uri
import com.athletex.model.Athlete
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.tasks.await
import java.util.*

class ProfileRepository : BaseRepository() {
    
    private val profileCollection = firestore.collection("athletes")
    private val storageRef = storage.reference.child("profile_pictures")
    
    suspend fun saveAthleteProfile(athlete: Athlete): Result<Unit> {
        return safeCall {
            val currentUser = auth.currentUser
                ?: throw Exception("User not logged in")
            
            val athleteWithUserId = athlete.copy(
                id = currentUser.uid,
                email = currentUser.email ?: athlete.email,
                updatedAt = Date()
            )
            
            profileCollection.document(currentUser.uid)
                .set(athleteWithUserId)
                .await()
        }
    }
    
    suspend fun getAthleteProfile(): Result<Athlete?> {
        return safeCall {
            val currentUser = auth.currentUser
                ?: throw Exception("User not logged in")
            
            val document = profileCollection.document(currentUser.uid).get().await()
            if (document.exists()) {
                document.toObject(Athlete::class.java)
            } else {
                null
            }
        }
    }
    
    suspend fun uploadProfilePicture(imageUri: Uri): Result<String> {
        return safeCall {
            val currentUser = auth.currentUser
                ?: throw Exception("User not logged in")
            
            val fileName = "${currentUser.uid}_${System.currentTimeMillis()}.jpg"
            val imageRef = storageRef.child(fileName)
            
            val uploadTask = imageRef.putFile(imageUri).await()
            val downloadUrl = uploadTask.storage.downloadUrl.await()
            downloadUrl.toString()
        }
    }
    
    suspend fun updateProfilePicture(profilePictureUrl: String): Result<Unit> {
        return safeCall {
            val currentUser = auth.currentUser
                ?: throw Exception("User not logged in")
            
            profileCollection.document(currentUser.uid)
                .update("profilePictureUrl", profilePictureUrl, "updatedAt", Date())
                .await()
        }
    }
    
    suspend fun getAllAthletes(): Result<List<Athlete>> {
        return safeCall {
            val snapshot = profileCollection.get().await()
            snapshot.documents.mapNotNull { doc ->
                doc.toObject(Athlete::class.java)
            }
        }
    }
    
    suspend fun getAthletesByFilters(
        sport: String? = null,
        country: String? = null,
        minAge: Int? = null,
        maxAge: Int? = null
    ): Result<List<Athlete>> {
        return safeCall {
            var query = profileCollection.whereEqualTo("dummy", "dummy") // Start with dummy query
            
            sport?.let { 
                query = profileCollection.whereArrayContains("sportsPlayed", it)
            }
            
            country?.let {
                query = query.whereEqualTo("country", it)
            }
            
            val snapshot = query.get().await()
            val athletes = snapshot.documents.mapNotNull { doc ->
                doc.toObject(Athlete::class.java)
            }
            
            // Apply age filters in memory (Firestore doesn't support complex range queries easily)
            athletes.filter { athlete ->
                when {
                    minAge != null && athlete.age < minAge -> false
                    maxAge != null && athlete.age > maxAge -> false
                    else -> true
                }
            }
        }
    }
}
