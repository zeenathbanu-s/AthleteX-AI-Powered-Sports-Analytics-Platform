package com.athletex.repository

import com.athletex.model.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class TrainingRepository : BaseRepository() {
    
    private val trainingCollection = firestore.collection("training_programs")
    
    fun getTrainingPrograms(): List<TrainingProgram> {
        return generateStaticTrainingPrograms()
    }
    
    fun getProgramsBySport(sport: SportType): List<TrainingProgram> {
        return getTrainingPrograms().filter { it.sport == sport }
    }
    
    fun getProgramsByDifficulty(difficulty: DifficultyLevel): List<TrainingProgram> {
        return getTrainingPrograms().filter { it.difficulty == difficulty }
    }
    
    private fun generateStaticTrainingPrograms(): List<TrainingProgram> {
        return listOf(
            // Football Programs
            TrainingProgram(
                id = "fb_basic",
                sport = SportType.FOOTBALL,
                title = "Basic Football Training",
                description = "Fundamental football skills and conditioning",
                difficulty = DifficultyLevel.BEGINNER,
                duration = "4 weeks",
                exercises = listOf(
                    Exercise("fb_ex1", "Ball Control Drills", "Practice basic ball control with both feet", "15 minutes", "3 sets", ""),
                    Exercise("fb_ex2", "Passing Practice", "Short and long passes to improve accuracy", "20 minutes", "50 passes each foot", ""),
                    Exercise("fb_ex3", "Sprint Training", "Interval running to build speed and endurance", "25 minutes", "8x50m sprints", ""),
                    Exercise("fb_ex4", "Shooting Practice", "Practice shots from various angles", "20 minutes", "20 shots", "")
                )
            ),
            TrainingProgram(
                id = "fb_advanced",
                sport = SportType.FOOTBALL,
                title = "Advanced Football Training",
                description = "Advanced techniques and tactical training",
                difficulty = DifficultyLevel.ADVANCED,
                duration = "6 weeks",
                exercises = listOf(
                    Exercise("fb_adv1", "1v1 Drills", "One-on-one attacking and defending practice", "30 minutes", "15 reps each side", ""),
                    Exercise("fb_adv2", "Set Piece Training", "Free kicks, corners, and throw-ins", "25 minutes", "20 attempts", ""),
                    Exercise("fb_adv3", "Tactical Positioning", "Understanding formations and movement", "35 minutes", "Full session", ""),
                    Exercise("fb_adv4", "Plyometric Training", "Explosive power development", "20 minutes", "3 sets of 10", "")
                )
            ),
            
            // Basketball Programs
            TrainingProgram(
                id = "bb_basic",
                sport = SportType.BASKETBALL,
                title = "Basketball Fundamentals",
                description = "Essential basketball skills development",
                difficulty = DifficultyLevel.BEGINNER,
                duration = "4 weeks",
                exercises = listOf(
                    Exercise("bb_ex1", "Dribbling Drills", "Basic ball handling with both hands", "20 minutes", "5 minutes each hand", ""),
                    Exercise("bb_ex2", "Shooting Form", "Proper shooting technique practice", "25 minutes", "100 shots", ""),
                    Exercise("bb_ex3", "Layup Practice", "Left and right hand layups", "15 minutes", "50 layups total", ""),
                    Exercise("bb_ex4", "Defensive Stance", "Basic defensive positioning and movement", "15 minutes", "Continuous practice", "")
                )
            ),
            
            // Athletics Programs
            TrainingProgram(
                id = "ath_sprint",
                sport = SportType.ATHLETICS,
                title = "Sprint Training Program",
                description = "Improve speed and acceleration for sprints",
                difficulty = DifficultyLevel.INTERMEDIATE,
                duration = "8 weeks",
                exercises = listOf(
                    Exercise("ath_ex1", "Block Starts", "Practice explosive starts from blocks", "20 minutes", "10 starts", ""),
                    Exercise("ath_ex2", "Acceleration Runs", "30-60m acceleration training", "25 minutes", "6x60m", ""),
                    Exercise("ath_ex3", "Speed Endurance", "Maintain top speed over distance", "30 minutes", "4x150m", ""),
                    Exercise("ath_ex4", "Technique Drills", "Running form and efficiency", "20 minutes", "Various drills", "")
                )
            ),
            
            // Handball Programs
            TrainingProgram(
                id = "hb_basic",
                sport = SportType.HANDBALL,
                title = "Handball Basics",
                description = "Introduction to handball skills",
                difficulty = DifficultyLevel.BEGINNER,
                duration = "5 weeks",
                exercises = listOf(
                    Exercise("hb_ex1", "Passing Drills", "Various passing techniques", "20 minutes", "100 passes", ""),
                    Exercise("hb_ex2", "Shooting Practice", "Goal shooting from different positions", "25 minutes", "50 shots", ""),
                    Exercise("hb_ex3", "Dribbling", "Ball control while moving", "15 minutes", "Continuous", ""),
                    Exercise("hb_ex4", "Defense Training", "Blocking and interception", "20 minutes", "Various scenarios", "")
                )
            ),
            
            // Hockey Programs
            TrainingProgram(
                id = "hk_basic",
                sport = SportType.HOCKEY,
                title = "Hockey Fundamentals",
                description = "Basic hockey skills and conditioning",
                difficulty = DifficultyLevel.BEGINNER,
                duration = "6 weeks",
                exercises = listOf(
                    Exercise("hk_ex1", "Stick Handling", "Ball control with hockey stick", "20 minutes", "Continuous practice", ""),
                    Exercise("hk_ex2", "Passing Drills", "Accurate passing to teammates", "25 minutes", "100 passes", ""),
                    Exercise("hk_ex3", "Shooting Practice", "Goal scoring techniques", "20 minutes", "50 shots", ""),
                    Exercise("hk_ex4", "Agility Training", "Quick direction changes", "15 minutes", "Various patterns", "")
                )
            ),
            
            // Kabaddi Programs
            TrainingProgram(
                id = "kb_basic",
                sport = SportType.KABADDI,
                title = "Kabaddi Training",
                description = "Traditional Kabaddi skills and techniques",
                difficulty = DifficultyLevel.INTERMEDIATE,
                duration = "4 weeks",
                exercises = listOf(
                    Exercise("kb_ex1", "Raiding Practice", "Attacking techniques and breath control", "25 minutes", "20 raids", ""),
                    Exercise("kb_ex2", "Tackling Drills", "Defensive techniques", "20 minutes", "Various tackles", ""),
                    Exercise("kb_ex3", "Agility Training", "Quick movements and dodging", "20 minutes", "Agility circuits", ""),
                    Exercise("kb_ex4", "Strength Training", "Building power for tackles", "25 minutes", "3 sets each exercise", "")
                )
            )
        )
    }
}
