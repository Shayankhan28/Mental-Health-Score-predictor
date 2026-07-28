document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("prediction-form");
    const submitBtn = document.getElementById("submit-btn");
    
    // UI Card States
    const emptyState = document.getElementById("empty-state");
    const loadingState = document.getElementById("loading-state");
    const resultState = document.getElementById("result-state");
    
    // Result Card Elements
    const scoreValue = document.getElementById("score-value");
    const statusBadge = document.getElementById("status-badge");
    const statusDot = statusBadge.querySelector(".status-dot");
    const statusText = document.getElementById("status-text");
    const recommendationText = document.getElementById("recommendation-text");
    const gaugeFill = document.getElementById("gauge-fill");
    const gaugeNeedle = document.getElementById("gauge-needle");
    const recommendationBox = document.querySelector(".recommendation-box");

    let animationFrameId = null;

    // Helper: State Switcher
    const switchState = (activeElement) => {
        [emptyState, loadingState, resultState].forEach(el => el.classList.remove("active"));
        activeElement.classList.add("active");
    };

    /**
     * HEALTH SCORE EVALUATION LOGIC
     * High Score (e.g. 7.04) = High Risk / High Stress / Severe Strain
     */
    const getScoreAnalysis = (score) => {
        if (score <= 2.5) {
            return { 
                color: "#6EE7B7", 
                bg: "rgba(5, 150, 105, 0.2)", 
                border: "rgba(110, 231, 183, 0.5)",
                status: "Low Risk / Optimal", 
                rec: "Outstanding mental and physical balance! Your daily routines foster high resilience." 
            };
        } else if (score <= 5.0) {
            return { 
                color: "#34D399", 
                bg: "rgba(16, 185, 129, 0.15)", 
                border: "rgba(16, 185, 129, 0.4)",
                status: "Mild Risk / Stable", 
                rec: "Fair lifestyle routine. Take frequent offline breaks during study hours." 
            };
        } else if (score <= 7.5) {
            return { 
                color: "#FBBF24", 
                bg: "rgba(245, 158, 11, 0.15)", 
                border: "rgba(245, 158, 11, 0.4)",
                status: "High Stress / Elevated Risk", 
                rec: "Elevated mental health risk detected (7.0+ score). Take regular breaks from screen time and prioritize nightly sleep." 
            };
        } else {
            return { 
                color: "#FF6B6B", 
                bg: "rgba(239, 68, 68, 0.15)", 
                border: "rgba(239, 68, 68, 0.4)",
                status: "Critical Risk Level", 
                rec: "Urgent lifestyle recalibration needed. High digital usage and stress indicators require immediate rest." 
            };
        }
    };

    // Form Submission Handler
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            age: parseInt(document.getElementById("age").value),
            gender: document.getElementById("gender").value,
            country: document.getElementById("country").value,
            academic_Level: document.getElementById("academic_Level").value,
            most_Used_Platform: document.getElementById("most_Used_Platform").value,
            purpose_Of_Use: document.getElementById("purpose_Of_Use").value,
            avg_Daily_Usage_Hours: parseFloat(document.getElementById("avg_Daily_Usage_Hours").value),
            daily_Unlocks: parseInt(document.getElementById("daily_Unlocks").value),
            study_Hours: parseFloat(document.getElementById("study_Hours").value),
            physical_Activity_Hours: parseFloat(document.getElementById("physical_Activity_Hours").value),
            sleep_Hours_Per_Night: parseFloat(document.getElementById("sleep_Hours_Per_Night").value),
            stress_Level: document.getElementById("stress_Level").value
        };

        submitBtn.disabled = true;
        submitBtn.querySelector(".btn-text").textContent = "Analyzing...";
        switchState(loadingState);

        try {
           const response = await fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
});

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const predictedScore = data.perdicted_mental_health;

            displayResults(predictedScore);

        } catch (error) {
            console.error("Prediction Request Failed:", error);
            alert("Could not fetch prediction. Please ensure your FastAPI backend is running at https://mental-health-score-predictor.vercel.app/predict");
            switchState(emptyState);
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector(".btn-text").textContent = "Generate Prediction";
        }
    });

    // Reset Form
    form.addEventListener("reset", () => {
        switchState(emptyState);
    });

    // Display Results with Spring Physics Animation
    const displayResults = (score) => {
        // Reset gauge states immediately
        gaugeNeedle.style.transition = "none";
        gaugeFill.style.transition = "none";
        gaugeNeedle.style.transform = `translateX(-50%) rotate(-90deg)`;
        gaugeFill.style.transform = `rotate(-45deg)`;
        scoreValue.textContent = "0.00";

        switchState(resultState);

        const safeScore = Math.max(0, Math.min(10, score));
        const analysis = getScoreAnalysis(safeScore);

        // Update Theme Colors & Content
        statusBadge.style.backgroundColor = analysis.bg;
        statusBadge.style.color = analysis.color;
        statusBadge.style.borderColor = analysis.border;
        statusDot.style.backgroundColor = analysis.color;
        statusText.textContent = analysis.status;
        recommendationText.textContent = analysis.rec;
        recommendationBox.style.borderLeftColor = analysis.color;

        // Force browser layout repaint
        void gaugeNeedle.offsetHeight;

        // Spring Transitions
        gaugeNeedle.style.transition = "transform 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
        gaugeFill.style.transition = "transform 1.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.6s ease";

        const needleRotation = (safeScore / 10) * 180 - 90;
        const fillRotation = (safeScore / 10) * 180 - 45;

        // Animate
        requestAnimationFrame(() => {
            gaugeNeedle.style.transform = `translateX(-50%) rotate(${needleRotation}deg)`;
            gaugeFill.style.transform = `rotate(${fillRotation}deg)`;
            gaugeFill.style.borderTopColor = analysis.color;
            gaugeFill.style.borderRightColor = analysis.color;
            
            animateValue(scoreValue, 0, safeScore, 1300);
        });
    };

    // Animated Counter
    const animateValue = (obj, start, end, duration) => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = easeProgress * (end - start) + start;
            
            obj.innerHTML = currentVal.toFixed(2);
            
            if (progress < 1) {
                animationFrameId = window.requestAnimationFrame(step);
            }
        };
        animationFrameId = window.requestAnimationFrame(step);
    };
});