package com.athletex.ui

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.athletex.R
import com.athletex.databinding.ActivityMainBinding
import com.athletex.ui.adapter.MainMenuAdapter
import com.athletex.ui.assessment.AssessmentActivity
import com.athletex.ui.auth.LoginActivity
import com.athletex.ui.model.MenuItem
import com.athletex.ui.performance.PerformanceActivity
import com.athletex.ui.profile.ProfileActivity
import com.athletex.ui.social.SocialFeedActivity
import com.athletex.ui.training.TrainingActivity
import com.athletex.ui.admin.AdminDashboardActivity
import com.google.firebase.auth.FirebaseAuth

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var auth: FirebaseAuth
    private lateinit var menuAdapter: MainMenuAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        auth = FirebaseAuth.getInstance()
        
        // Check if user is logged in
        if (auth.currentUser == null) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }
        
        setupUI()
        setupMenuRecyclerView()
    }
    
    private fun setupUI() {
        setSupportActionBar(binding.toolbar)
        
        binding.fabProfile.setOnClickListener {
            startActivity(Intent(this, ProfileActivity::class.java))
        }
    }
    
    private fun setupMenuRecyclerView() {
        val menuItems = listOf(
            MenuItem(
                title = "Assessment Tests",
                description = "Take athletic performance tests and track your progress",
                iconRes = R.drawable.ic_assessment_24,
                destinationClass = AssessmentActivity::class.java
            ),
            MenuItem(
                title = "Athletic Performance",
                description = "View your performance metrics and progress graphs",
                iconRes = R.drawable.ic_trending_up_24,
                destinationClass = PerformanceActivity::class.java
            ),
            MenuItem(
                title = "Training Programs",
                description = "Access sport-specific training plans and exercises",
                iconRes = R.drawable.ic_fitness_center_24,
                destinationClass = TrainingActivity::class.java
            ),
            MenuItem(
                title = "Social Feed",
                description = "Share your progress and connect with other athletes",
                iconRes = R.drawable.ic_people_24,
                destinationClass = SocialFeedActivity::class.java
            ),
            MenuItem(
                title = "Admin Dashboard",
                description = "Administrative tools and athlete management",
                iconRes = R.drawable.ic_admin_panel_24,
                destinationClass = AdminDashboardActivity::class.java
            )
        )
        
        menuAdapter = MainMenuAdapter(menuItems) { menuItem ->
            val intent = Intent(this, menuItem.destinationClass)
            startActivity(intent)
            overridePendingTransition(R.anim.slide_in_right, R.anim.slide_out_left)
        }
        
        binding.mainMenuRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = menuAdapter
        }
    }
}
