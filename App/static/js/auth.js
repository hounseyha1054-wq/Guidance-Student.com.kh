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
        form.parentNode.insertBefore(alertDiv, form);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
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
            showQuestion(1);
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            document.getElementById('questionsContainer').innerHTML = 
                '<p class="text-danger">Error loading assessment questions. Please refresh the page.</p>';
        });
}

// Render all questions dynamically
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    assessmentQuestions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.id = 'question' + (index + 1);
        questionDiv.style.display = 'none';
        
        let content = `
            <h6>${index + 1}. ${q.question}</h6>
        `;
        
        // Show fact or rule if available
        if (q.fact) {
            content += `<p class="small text-muted mb-3"><strong>Fact:</strong> ${q.fact}</p>`;
        }
        if (q.rule) {
            content += `<p class="small text-muted mb-3"><strong>Rule:</strong> ${q.rule}</p>`;
        }
        
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
    if (assessmentQuestions.length === 0) return;
    
    // Hide all questions
    for (let i = 1; i <= totalQuestions; i++) {
        const q = document.getElementById('question' + i);
        if (q) q.style.display = 'none';
    }
    
    // Show current question
    const currentQ = document.getElementById('question' + questionNum);
    if (currentQ) currentQ.style.display = 'block';
    
    // Update progress
    document.getElementById('currentQuestion').textContent = questionNum;
    const progress = (questionNum / totalQuestions) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    
    // Update button visibility
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (questionNum === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    } else if (questionNum === totalQuestions) {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
    
    currentQuestion = questionNum;
}

function nextQuestion() {
    // Check if current question is answered
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
    // Collect all answers
    const answers = {};
    for (let i = 1; i <= totalQuestions; i++) {
        const name = 'q' + i;
        const checked = document.querySelector('input[name="' + name + '"]:checked');
        if (checked) {
            answers[name] = checked.value;
        }
    }
    
    // Check if all questions answered
    if (Object.keys(answers).length < totalQuestions) {
        alert('Please answer all questions before submitting');
        return;
    }
    
    // Store answers globally so saveResult can access them
    currentAnswers = answers;
    
    // Calculate results based on selected categories
    const results = calculateResults(answers);
    
    // Show results
    document.getElementById('questionsContainer').style.display = 'none';
    document.getElementById('progressBar').parentElement.parentElement.style.display = 'none';
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
        interests: Object.keys(categoryScores)
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
    
    const selectedAreas = document.getElementById('selectedAreas');
    if (selectedAreas) selectedAreas.innerHTML = areasText;
    
    // Dynamic recommendation text
    const recText = `Based on your interest in ${results.primary} and ${results.secondary}, we recommend exploring careers in these fields.`;
    
    const recommendationEl = document.getElementById('recommendationText');
    if (recommendationEl) {
        recommendationEl.textContent = recText;
    }
    
    document.getElementById('resultBox').style.display = 'block';
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

    // Save to server
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
            // Reload the page to show updated profile
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
    
    // Initialize assessment form navigation
    showQuestion(1);
    
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const form = document.getElementById('loginForm') || document.getElementById('registerForm');
        form.parentNode.insertBefore(alertDiv, form);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }
;

// Question Navigation Functions
function showQuestion(questionNum) {
    // Hide all questions
    for (let i = 1; i <= totalQuestions; i++) {
        document.getElementById('question' + i).style.display = 'none';
    }
    
    // Show current question
    document.getElementById('question' + questionNum).style.display = 'block';
    
    // Update progress
    document.getElementById('currentQuestion').textContent = questionNum;
    const progress = (questionNum / totalQuestions) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    
    // Update button visibility
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (questionNum === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    } else if (questionNum === totalQuestions) {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
    
    currentQuestion = questionNum;
}

function nextQuestion() {
    // Check if current question is answered
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
    // Collect all answers
    const answers = {};
    for (let i = 1; i <= totalQuestions; i++) {
        const name = 'q' + i;
        const checked = document.querySelector('input[name="' + name + '"]:checked');
        if (checked) {
            answers[name] = checked.value;
        }
    }
    
    // Check if all questions answered
    if (Object.keys(answers).length < totalQuestions) {
        alert('Please answer all questions before submitting');
        return;
    }
    
    // Calculate results
    const results = calculateResults(answers);
    
    // Show results
    document.getElementById('assessmentForm').style.display = 'none';
    document.getElementById('progressBar').parentElement.parentElement.style.display = 'none';
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
        scores: categoryScores
    };
}

function showResults(results) {
    document.getElementById('primaryCareer').textContent = results.primary;
    document.getElementById('secondaryCareer').textContent = results.secondary;
    document.getElementById('confidence').textContent = results.confidence + '%';
    
    // Dynamic recommendation text
    const recText = `Based on your interest in ${results.primary} and ${results.secondary}, we recommend exploring careers in these fields.`;
    document.getElementById('recommendationText').textContent = recText;
    
    document.getElementById('resultBox').style.display = 'block';
}

function saveResult() {
    const primaryCareer = document.getElementById('primaryCareer').textContent;
    const secondaryCareer = document.getElementById('secondaryCareer').textContent;
    const confidence = parseInt(document.getElementById('confidence').textContent);
    
    // Save to server
    fetch('/api/save-assessment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            primary_career: primaryCareer,
            secondary_career: secondaryCareer,
            confidence: confidence
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Assessment result saved successfully!');
            // Reload the page to show updated profile
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
