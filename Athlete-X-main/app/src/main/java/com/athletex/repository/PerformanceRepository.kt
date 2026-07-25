package com.athletex.repository

import com.athletex.model.MetricType
import com.athletex.model.PerformanceMetric
import kotlinx.coroutines.tasks.await
import java.util.*

class PerformanceRepository : BaseRepository() {
    
    private val metricsCollection = firestore.collection("performance_metrics")
    
    suspend fun savePerformanceMetric(metric: PerformanceMetric): Result<String> {
        return safeCall {
            val currentUser = auth.currentUser
                ?: throw Exception("User not logged in")
            
            val metricWithUserId = metric.copy(
                athleteId = currentUser.uid,
                timestamp = Date()
            )
            
            val documentRef = metricsCollection.add(metricWithUserId).await()
            documentRef.id
        }
    }
    
    suspend fun getAthleteMetrics(athleteId: String): Result<List<PerformanceMetric>> {
        return safeCall {
            val snapshot = metricsCollection
                .whereEqualTo("athleteId", athleteId)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { doc ->
                doc.toObject(PerformanceMetric::class.java)?.copy(id = doc.id)
            }
        }
    }
    
    suspend fun getMetricsByType(athleteId: String, metricType: MetricType): Result<List<PerformanceMetric>> {
        return safeCall {
            val snapshot = metricsCollection
                .whereEqualTo("athleteId", athleteId)
                .whereEqualTo("metricType", metricType.name)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.ASCENDING)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { doc ->
                doc.toObject(PerformanceMetric::class.java)?.copy(id = doc.id)
            }
        }
    }
    
    suspend fun getLatestMetricByType(athleteId: String, metricType: MetricType): Result<PerformanceMetric?> {
        return safeCall {
            val snapshot = metricsCollection
                .whereEqualTo("athleteId", athleteId)
                .whereEqualTo("metricType", metricType.name)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .limit(1)
                .get()
                .await()
            
            snapshot.documents.firstOrNull()?.let { doc ->
                doc.toObject(PerformanceMetric::class.java)?.copy(id = doc.id)
            }
        }
    }
    
    suspend fun deleteMetric(metricId: String): Result<Unit> {
        return safeCall {
            metricsCollection.document(metricId).delete().await()
        }
    }
    
    fun getMetricUnit(metricType: MetricType): String {
        return when (metricType) {
            MetricType.TIMING_100M, MetricType.TIMING_200M, MetricType.TIMING_800M -> "seconds"
            MetricType.LONG_JUMP, MetricType.SHOT_PUT_DISTANCE -> "meters"
        }
    }
    
    fun getMetricTitle(metricType: MetricType): String {
        return when (metricType) {
            MetricType.TIMING_100M -> "100m Sprint"
            MetricType.TIMING_200M -> "200m Sprint"
            MetricType.TIMING_800M -> "800m Run"
            MetricType.LONG_JUMP -> "Long Jump"
            MetricType.SHOT_PUT_DISTANCE -> "Shot Put"
        }
    }
}
