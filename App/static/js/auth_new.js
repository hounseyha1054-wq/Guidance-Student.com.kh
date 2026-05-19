// static/js/auth.js
let currentQuestion = 1;
let totalQuestions = 10;
let assessmentQuestions = [];
let currentAnswers = {};

document.addEventListener('DOMContentLoaded', function() {
    // Load assessment questions from API
    loadAssessmentQuestions();
    
    // Form validation for login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            if (!username || !password) {
                e.preventDefault();
                showAlert('Please fill in all fields', 'danger');
                return false;
            }
        });
    }
    
    // Form validation for registration
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirm_password').value.trim();
            
            if (!username || !email || !password || !confirmPassword) {
                e.preventDefault();
                showAlert('Please fill in all fields', 'danger');
                return false;
            }
            
            if (password !== confirmPassword) {
                e.preventDefault();
                showAlert('Passwords do not match', 'danger');
                return false;
            }
            
            if (password.length < 8) {
                e.preventDefault();
                showAlert('Password must be at least 8 characters long', 'danger');
                return false;
            }
        });
    }
    
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const form = document.getElementById('loginForm') || document.getElementById('registerForm');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(alertDiv, form);
        }
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 150);
            }
        }, 5000);
    }
});

// Load assessment questions from API
function loadAssessmentQuestions() {
    fetch('/api/assessment-questions')
        .then(response => response.json())
        .then(data => {
            assessmentQuestions = data;
            totalQuestions = data.length;
            renderQuestions();
            if (totalQuestions > 0) {
                showQuestion(1);
            } else {
                const container = document.getElementById('questionsContainer');
                if(container) container.innerHTML = '<p class="text-center">No assessment questions available. Please add Facts and Rules in your Dashboard first.</p>';
                // Hide navigation buttons if no questions
                const navBtns = document.querySelector('.d-flex.justify-content-between.mt-4');
                if(navBtns) navBtns.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            const container = document.getElementById('questionsContainer');
            if(container) container.innerHTML = '<p class="text-danger">Error loading assessment questions. Please refresh the page.</p>';
        });
}

// Render all questions dynamically
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    assessmentQuestions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.id = 'question' + (index + 1);
        questionDiv.style.display = 'none';
        
        let content = `<h6>${index + 1}. ${q.question}</h6>`;
        
        if (q.fact) content += `<p class="small text-muted mb-3"><strong>Fact:</strong> ${q.fact}</p>`;
        if (q.rule) content += `<p class="small text-muted mb-3"><strong>Rule:</strong> ${q.rule}</p>`;
        
        content += `
            <div class="form-check">
                <input class="form-check-input" type="radio" name="q${index + 1}" id="q${index + 1}y" value="yes">
                <label class="form-check-label" for="q${index + 1}y">Yes</label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="radio" name="q${index + 1}" id="q${index + 1}n" value="no">
                <label class="form-check-label" for="q${index + 1}n">No</label>
            </div>
        `;
        
        questionDiv.innerHTML = content;
        container.appendChild(questionDiv);
    });
}

// Question Navigation Functions
function showQuestion(questionNum) {
    // Hide all questions
    for (let i = 1; i <= totalQuestions; i++) {
        const q = document.getElementById('question' + i);
        if (q) q.style.display = 'none';
    }
    
    // Show current question
    const currentQ = document.getElementById('question' + questionNum);
    if (currentQ) currentQ.style.display = 'block';
    
    // Update progress
    const progressEl = document.getElementById('currentQuestion');
    if (progressEl) progressEl.textContent = questionNum;
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = (questionNum / totalQuestions) * 100;
        progressBar.style.width = progress + '%';
    }
    
    // Update button visibility
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (questionNum === 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'block';
        if (submitBtn) submitBtn.style.display = 'none';
    } else if (questionNum === totalQuestions) {
        if (prevBtn) prevBtn.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'block';
    } else {
        if (prevBtn) prevBtn.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'block';
        if (submitBtn) submitBtn.style.display = 'none';
    }
    
    currentQuestion = questionNum;
}

function nextQuestion() {
    const name = 'q' + currentQuestion;
    const checked = document.querySelector('input[name="' + name + '"]:checked');
    
    if (!checked) {
        alert('Please answer this question before proceeding');
        return;
    }
    
    if (currentQuestion < totalQuestions) {
        showQuestion(currentQuestion + 1);
    }
}

function previousQuestion() {
    if (currentQuestion > 1) {
        showQuestion(currentQuestion - 1);
    }
}

function submitAssessment() {
    const answers = {};
    for (let i = 1; i <= totalQuestions; i++) {
        const name = 'q' + i;
        const checked = document.querySelector('input[name="' + name + '"]:checked');
        if (checked) {
            answers[name] = checked.value;
        }
    }
    
    if (Object.keys(answers).length < totalQuestions) {
        alert('Please answer all questions before submitting');
        return;
    }
    
    // Store answers globally so saveResult can access them
    currentAnswers = answers;
    
    const results = calculateResults(answers);
    
    // Hide the form
    const form = document.getElementById('assessmentForm');
    if (form) form.parentElement.style.display = 'none';
    
    // Hide the progress bar container
    const progressBar = document.getElementById('progressBar');
    if (progressBar && progressBar.parentElement) {
        progressBar.parentElement.style.display = 'none';
    }
    
    showResults(results);
}

function calculateResults(answers) {
    // Dynamic calculation based on loaded questions from Dashboard (Facts/Rules)
    const categoryScores = {};
    
    assessmentQuestions.forEach((q, index) => {
        const key = 'q' + (index + 1);
        // Check if user answered 'yes'
        if (answers[key] === 'yes') {
            const cat = q.category || 'General';
            // Increment score for this category
            if (!categoryScores[cat]) {
                categoryScores[cat] = 0;
            }
            categoryScores[cat] += 1;
        }
    });
    
    // Sort categories by score (highest first)
    const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
    
    // Determine Primary and Secondary careers based on top categories
    const primary = sorted.length > 0 ? sorted[0][0] : 'General Technology';
    const secondary = sorted.length > 1 ? sorted[1][0] : 'IT Support';
    
    // Calculate confidence based on how many items matched the top category
    const topScore = sorted.length > 0 ? sorted[0][1] : 0;
    const confidence = Math.min(95, 50 + (topScore * 10));
    
    return {
        primary: primary,
        secondary: secondary,
        confidence: Math.round(confidence),
        scores: categoryScores,
        interests: Object.keys(categoryScores) // For display compatibility
    };
}

function showResults(results) {
    const primaryEl = document.getElementById('primaryCareer');
    if (primaryEl) primaryEl.textContent = results.primary;
    
    const secondaryEl = document.getElementById('secondaryCareer');
    if (secondaryEl) secondaryEl.textContent = results.secondary;
    
    const confidenceEl = document.getElementById('confidence');
    if (confidenceEl) confidenceEl.textContent = results.confidence + '%';
    
    const areasText = '<strong>Your Interests:</strong> ' + 
        (results.interests && results.interests.length > 0 ? results.interests.join(', ') : 'General Technology');
    
    const recommendationEl = document.getElementById('recommendationText');
    if (recommendationEl) {
        recommendationEl.textContent = `Based on your interest in ${results.primary} and ${results.secondary}, we recommend exploring careers in these fields.`;
    }
    
    const resultBox = document.getElementById('resultBox');
    if (resultBox) resultBox.style.display = 'block';
}

function saveResult() {
    const primaryCareer = document.getElementById('primaryCareer').textContent;
    const secondaryCareer = document.getElementById('secondaryCareer').textContent;
    const confidence = parseInt(document.getElementById('confidence').textContent);
    
    // Prepare detailed answers to send to backend
    const detailedAnswers = [];
    assessmentQuestions.forEach((q, index) => {
        const key = 'q' + (index + 1);
        if (currentAnswers[key]) {
            detailedAnswers.push({
                question: q.question,
                category: q.category || 'General',
                answer: currentAnswers[key]
            });
        }
    });

    fetch('/api/save-assessment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            primary_career: primaryCareer,
            secondary_career: secondaryCareer,
            confidence: confidence,
            answers: detailedAnswers
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Assessment result saved successfully!');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            alert('Error saving assessment: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error saving assessment');
    });
}

function retakeAssessment() {
    location.reload();
}