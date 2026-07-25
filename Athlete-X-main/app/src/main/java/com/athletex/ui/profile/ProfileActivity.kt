package com.athletex.ui.profile

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.Menu
import android.view.MenuItem
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModelProvider
import com.athletex.R
import com.athletex.databinding.ActivityProfileBinding
import com.athletex.model.Athlete
import com.athletex.model.SportType
import com.athletex.utils.showToast
import com.athletex.viewmodel.ProfileViewModel
import com.bumptech.glide.Glide
import com.google.firebase.auth.FirebaseAuth
import java.util.*

class ProfileActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityProfileBinding
    private lateinit var viewModel: ProfileViewModel
    private var isEditMode = false
    private var selectedImageUri: Uri? = null
    
    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.let { uri ->
                selectedImageUri = uri
                loadProfileImage(uri)
                if (isEditMode) {
                    viewModel.uploadProfilePicture(uri)
                }
            }
        }
    }
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            openImagePicker()
        } else {
            showToast("Permission required to upload profile picture")
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        viewModel = ViewModelProvider(this)[ProfileViewModel::class.java]
        
        setupUI()
        observeViewModel()
        viewModel.loadAthleteProfile()
    }
    
    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_profile, menu)
        menu?.findItem(R.id.action_edit)?.isVisible = !isEditMode
        menu?.findItem(R.id.action_save)?.isVisible = isEditMode
        menu?.findItem(R.id.action_cancel)?.isVisible = isEditMode
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                if (isEditMode) {
                    showDiscardChangesDialog()
                } else {
                    finish()
                }
                true
            }
            R.id.action_edit -> {
                toggleEditMode(true)
                true
            }
            R.id.action_save -> {
                saveProfile()
                true
            }
            R.id.action_cancel -> {
                showDiscardChangesDialog()
                true
            }
            R.id.action_logout -> {
                logout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun setupUI() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Profile"
        
        toggleEditMode(false)
        
        binding.ivProfilePicture.setOnClickListener {
            if (isEditMode) {
                requestImagePermission()
            }
        }
        
        binding.btnEditProfilePicture.setOnClickListener {
            requestImagePermission()
        }
        
        setupSportsSpinner()
    }
    
    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { isLoading ->
            // You can add loading UI here if needed
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
        
        viewModel.athlete.observe(this) { athlete ->
            populateProfile(athlete)
        }
        
        viewModel.profileSaved.observe(this) { saved ->
            if (saved) {
                toggleEditMode(false)
            }
        }
    }
    
    private fun populateProfile(athlete: Athlete) {
        binding.apply {
            etName.setText(athlete.name)
            etEmail.setText(athlete.email)
            etPhoneNumber.setText(athlete.phoneNumber)
            etAge.setText(if (athlete.age > 0) athlete.age.toString() else "")
            etWeight.setText(if (athlete.weight > 0) athlete.weight.toString() else "")
            etHeight.setText(if (athlete.height > 0) athlete.height.toString() else "")
            etCountry.setText(athlete.country)
            etState.setText(athlete.state)
            etCity.setText(athlete.city)
            etPinCode.setText(athlete.pinCode)
            
            if (athlete.profilePictureUrl.isNotEmpty()) {
                loadProfileImage(athlete.profilePictureUrl)
            }
        }
    }
    
    private fun loadProfileImage(imageSource: Any) {
        Glide.with(this)
            .load(imageSource)
            .placeholder(R.drawable.ic_person_24)
            .error(R.drawable.ic_person_24)
            .circleCrop()
            .into(binding.ivProfilePicture)
    }
    
    private fun setupSportsSpinner() {
        // This is a simplified setup - you would typically use a proper multi-select
        // or RecyclerView with checkboxes for sports selection
    }
    
    private fun toggleEditMode(editMode: Boolean) {
        isEditMode = editMode
        
        binding.apply {
            etName.isEnabled = editMode
            etPhoneNumber.isEnabled = editMode
            etAge.isEnabled = editMode
            etWeight.isEnabled = editMode
            etHeight.isEnabled = editMode
            etCountry.isEnabled = editMode
            etState.isEnabled = editMode
            etCity.isEnabled = editMode
            etPinCode.isEnabled = editMode
            
            btnEditProfilePicture.visibility = if (editMode) android.view.View.VISIBLE else android.view.View.GONE
        }
        
        invalidateOptionsMenu()
    }
    
    private fun saveProfile() {
        val athlete = createAthleteFromForm()
        if (validateProfile(athlete)) {
            viewModel.saveAthleteProfile(athlete)
        }
    }
    
    private fun createAthleteFromForm(): Athlete {
        return Athlete(
            name = binding.etName.text.toString().trim(),
            email = binding.etEmail.text.toString().trim(),
            phoneNumber = binding.etPhoneNumber.text.toString().trim(),
            age = binding.etAge.text.toString().toIntOrNull() ?: 0,
            weight = binding.etWeight.text.toString().toDoubleOrNull() ?: 0.0,
            height = binding.etHeight.text.toString().toDoubleOrNull() ?: 0.0,
            country = binding.etCountry.text.toString().trim(),
            state = binding.etState.text.toString().trim(),
            city = binding.etCity.text.toString().trim(),
            pinCode = binding.etPinCode.text.toString().trim(),
            sportsPlayed = listOf(SportType.FOOTBALL.name), // Simplified - would be from user selection
            profilePictureUrl = selectedImageUri?.toString() ?: "",
            createdAt = Date(),
            updatedAt = Date()
        )
    }
    
    private fun validateProfile(athlete: Athlete): Boolean {
        return when {
            athlete.name.isEmpty() -> {
                showToast("Please enter your name")
                false
            }
            athlete.age <= 0 -> {
                showToast("Please enter a valid age")
                false
            }
            else -> true
        }
    }
    
    private fun requestImagePermission() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED -> {
                openImagePicker()
            }
            else -> {
                requestPermissionLauncher.launch(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }
    }
    
    private fun openImagePicker() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        imagePickerLauncher.launch(intent)
    }
    
    private fun showDiscardChangesDialog() {
        AlertDialog.Builder(this)
            .setTitle("Discard Changes?")
            .setMessage("You have unsaved changes. Do you want to discard them?")
            .setPositiveButton("Discard") { _, _ ->
                toggleEditMode(false)
                viewModel.loadAthleteProfile() // Reload original data
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun logout() {
        AlertDialog.Builder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Logout") { _, _ ->
                FirebaseAuth.getInstance().signOut()
                finish()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
