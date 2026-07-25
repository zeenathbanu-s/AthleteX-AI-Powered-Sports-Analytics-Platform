package com.athletex.ui.assessment

import android.Manifest
import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.*
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.lifecycle.ViewModelProvider
import com.athletex.databinding.ActivityAssessmentBinding
import com.athletex.model.TestType
import com.athletex.utils.showToast
import com.athletex.viewmodel.AssessmentViewModel
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class AssessmentActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityAssessmentBinding
    private lateinit var viewModel: AssessmentViewModel
    private var selectedVideoUri: Uri? = null
    private var selectedTestType: TestType = TestType.SHOT_PUT
    
    // CameraX variables
    private var videoCapture: VideoCapture<Recorder>? = null
    private var recording: Recording? = null
    private lateinit var cameraExecutor: ExecutorService
    private var isRecording = false

    private val videoPickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.let { uri ->
                selectedVideoUri = uri
                binding.tvSelectedVideo.visibility = View.VISIBLE
                binding.tvSelectedVideo.text = "Video selected"
            }
        }
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            openVideoPicker()
        } else {
            showToast("Permission required to pick video")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAssessmentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        viewModel = ViewModelProvider(this)[AssessmentViewModel::class.java]
        cameraExecutor = Executors.newSingleThreadExecutor()

        setupUI()
        observeViewModel()
        requestCameraPermissions()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }

    private fun setupUI() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Assessment Tests"

        setupTestTypeDropdown()

        binding.btnPickVideo.setOnClickListener {
            requestVideoPermission()
        }
        
        binding.btnRecordVideo.setOnClickListener {
            if (isRecording) {
                stopRecording()
            } else {
                startRecording()
            }
        }

        binding.btnSaveTest.setOnClickListener {
            val notes = binding.etNotes.text.toString().trim()
            viewModel.saveTest(selectedTestType, notes, selectedVideoUri)
        }
    }
    
    private fun setupTestTypeDropdown() {
        val testTypes = TestType.values().map { it.name.replace("_", " ") }
        val adapter = android.widget.ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, testTypes)
        binding.spinnerTestType.setAdapter(adapter)
        binding.spinnerTestType.setOnItemClickListener { _, _, position, _ ->
            selectedTestType = TestType.values()[position]
        }
    }

    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        }

        viewModel.error.observe(this) { error ->
            if (!error.isNullOrEmpty()) {
                showToast(error)
            }
        }

        viewModel.success.observe(this) { success ->
            if (!success.isNullOrEmpty()) {
                showToast(success)
            }
        }

        viewModel.testSaved.observe(this) { saved ->
            if (saved) {
                binding.etNotes.setText("")
                binding.tvSelectedVideo.visibility = View.GONE
                selectedVideoUri = null
            }
        }
    }

    private fun requestVideoPermission() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED -> {
                openVideoPicker()
            }
            else -> {
                requestPermissionLauncher.launch(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }
    }

    private fun openVideoPicker() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Video.Media.EXTERNAL_CONTENT_URI)
        videoPickerLauncher.launch(intent)
    }
    
    private fun requestCameraPermissions() {
        val requiredPermissions = mutableListOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
        
        if (android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.P) {
            requiredPermissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }
        
        val missingPermissions = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (missingPermissions.isEmpty()) {
            startCamera()
        } else {
            requestMultiplePermissions.launch(missingPermissions.toTypedArray())
        }
    }
    
    private val requestMultiplePermissions = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions.all { it.value }) {
            startCamera()
        } else {
            showToast("Camera and microphone permissions are required for video recording")
        }
    }
    
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        
        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()
            
            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.previewView.surfaceProvider)
            }
            
            val recorder = Recorder.Builder()
                .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
                .build()
            videoCapture = VideoCapture.withOutput(recorder)
            
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            
            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, videoCapture)
            } catch (exc: Exception) {
                Log.e("AssessmentActivity", "Use case binding failed", exc)
            }
            
        }, ContextCompat.getMainExecutor(this))
    }
    
    private fun startRecording() {
        val videoCapture = this.videoCapture ?: return
        
        binding.btnRecordVideo.isEnabled = false
        
        val curRecording = recording
        if (curRecording != null) {
            curRecording.stop()
            recording = null
            return
        }
        
        val name = SimpleDateFormat("yyyy-MM-dd-HH-mm-ss-SSS", Locale.getDefault())
            .format(System.currentTimeMillis())
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, name)
            put(MediaStore.MediaColumns.MIME_TYPE, "video/mp4")
            put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/AthleteX-Assessments")
        }
        
        val mediaStoreOutputOptions = MediaStoreOutputOptions
            .Builder(contentResolver, MediaStore.Video.Media.EXTERNAL_CONTENT_URI)
            .setContentValues(contentValues)
            .build()
        
        recording = videoCapture.output
            .prepareRecording(this, mediaStoreOutputOptions)
            .apply {
                if (ContextCompat.checkSelfPermission(this@AssessmentActivity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    withAudioEnabled()
                }
            }
            .start(ContextCompat.getMainExecutor(this)) { recordEvent ->
                when (recordEvent) {
                    is VideoRecordEvent.Start -> {
                        isRecording = true
                        binding.btnRecordVideo.apply {
                            text = "Stop Recording"
                            isEnabled = true
                        }
                    }
                    is VideoRecordEvent.Finalize -> {
                        if (!recordEvent.hasError()) {
                            selectedVideoUri = recordEvent.outputResults.outputUri
                            binding.tvSelectedVideo.visibility = View.VISIBLE
                            binding.tvSelectedVideo.text = "Video recorded successfully"
                            showToast("Video recorded successfully")
                        } else {
                            recording?.close()
                            recording = null
                            showToast("Video recording failed: ${recordEvent.error}")
                        }
                        
                        isRecording = false
                        binding.btnRecordVideo.apply {
                            text = "Record Video"
                            isEnabled = true
                        }
                    }
                }
            }
    }
    
    private fun stopRecording() {
        recording?.stop()
        recording = null
    }
}
