package com.athletex.repository

import android.net.Uri
import com.athletex.model.AssessmentTest
import com.athletex.model.TestType
import kotlinx.coroutines.tasks.await
import java.util.*

class AssessmentRepository : BaseRepository() {
    
    private val testsCollection = firestore.collection("assessment_tests")
    private val storageRef = storage.reference.child("assessment_videos")
    
    suspend fun saveAssessmentTest(test: AssessmentTest): Result<String> {
        return safeCall {
            val currentUser = auth.currentUser
                ?: throw Exception("User not logged in")
            
            val testWithUserId = test.copy(
                athleteId = currentUser.uid,
                timestamp = Date()
            )
            
            val documentRef = testsCollection.add(testWithUserId).await()
            documentRef.id
        }
    }
    
    suspend fun uploadTestVideo(videoUri: Uri, testId: String): Result<String> {
        return safeCall {
            val currentUser = auth.currentUser
                ?: throw Exception("User not logged in")
            
            val fileName = "${currentUser.uid}_${testId}_${System.currentTimeMillis()}.mp4"
            val videoRef = storageRef.child(fileName)
            
            val uploadTask = videoRef.putFile(videoUri).await()
            val downloadUrl = uploadTask.storage.downloadUrl.await()
            downloadUrl.toString()
        }
    }
    
    suspend fun updateTestVideoUrl(testId: String, videoUrl: String): Result<Unit> {
        return safeCall {
            testsCollection.document(testId)
                .update("videoUrl", videoUrl)
                .await()
        }
    }
    
    suspend fun getAthleteTests(athleteId: String): Result<List<AssessmentTest>> {
        return safeCall {
            val snapshot = testsCollection
                .whereEqualTo("athleteId", athleteId)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { doc ->
                doc.toObject(AssessmentTest::class.java)?.copy(id = doc.id)
            }
        }
    }
    
    suspend fun getAllTests(): Result<List<AssessmentTest>> {
        return safeCall {
            val snapshot = testsCollection
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { doc ->
                doc.toObject(AssessmentTest::class.java)?.copy(id = doc.id)
            }
        }
    }
    
    suspend fun getTestsByType(testType: TestType): Result<List<AssessmentTest>> {
        return safeCall {
            val snapshot = testsCollection
                .whereEqualTo("testType", testType.name)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { doc ->
                doc.toObject(AssessmentTest::class.java)?.copy(id = doc.id)
            }
        }
    }
    
    fun generateDummyScore(testType: TestType): Double {
        // Generate dummy scores for different test types
        return when (testType) {
            TestType.SHOT_PUT -> (8.0..15.0).random()
            TestType.BROAD_JUMP -> (2.0..3.5).random()
            TestType.SHUTTLE_RUN -> (12.0..18.0).random()
            TestType.SQUATS -> (20.0..50.0).random()
            TestType.HIGH_JUMP -> (1.2..2.1).random()
        }
    }
}
