// Dashboard interactive behavior: sidebar toggle, simple charts and helpers
(function(){
  'use strict';

  // Load user profile on page load
  function loadUserProfile(){
    fetch('/api/user-profile')
      .then(response => response.json())
      .then(data => {
        if(data.id){
          document.getElementById('userUsername').textContent = data.username || '-';
          document.getElementById('userId').textContent = data.id || '-';
          document.getElementById('recommendedCareer').textContent = data.recommended_career || '-';
          if(data.confidence_score > 0){
            document.getElementById('careerConfidence').textContent = data.confidence_score + '%';
          }
          if(data.assessment_completed){
            document.getElementById('assessmentStatus').className = 'badge bg-success';
            document.getElementById('assessmentStatus').textContent = 'Completed';
          } else {
            document.getElementById('assessmentStatus').className = 'badge bg-warning';
            document.getElementById('assessmentStatus').textContent = 'Not Started';
          }
        }
      })
      .catch(err => console.log('User profile load error:', err));
  }

  // Sidebar toggle
  function setupSidebarToggle(){
    const toggles = document.querySelectorAll('.js-sidebar-toggle, .sidebar-toggle');
    toggles.forEach(t => t.addEventListener('click', function(e){
      e.preventDefault();
      document.querySelector('.wrapper').classList.toggle('sidebar-collapsed');
    }));
  }

  // Lazy-load feather icons then replace
  function loadFeather(){
    if(window.feather) return window.feather.replace();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/feather.min.js';
    s.onload = () => window.feather && window.feather.replace();
    document.head.appendChild(s);
  }

  // Load Chart.js and create basic charts if canvases exist
  function setupCharts(){
    const need = document.querySelector('#areaChart, #pieChart');
    if(!need) return;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => initCharts();
    document.head.appendChild(s);
  }

  let areaChart, pieChart;
  function initCharts(){
    try{
      const ctxA = document.getElementById('areaChart');
      const ctxP = document.getElementById('pieChart');
      if(ctxA){
        areaChart = new Chart(ctxA.getContext('2d'), {
          type: 'line',
          data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [{label:'Recommendations',data: randomArray(12,50,200),fill:true,backgroundColor:'rgba(13,110,253,0.12)',borderColor:'#0d6efd'}]
          },
          options:{responsive:true,maintainAspectRatio:false}
        });
      }
      if(ctxP){
        pieChart = new Chart(ctxP.getContext('2d'),{
          type:'pie',
          data:{labels:['Engineering','Health','Business','Arts','IT'],datasets:[{data:randomArray(5,10,60),backgroundColor:['#0d6efd','#198754','#0dcaf0','#ffc107','#6f42c1']}]},
          options:{responsive:true,maintainAspectRatio:false}
        });
      }
    }catch(e){console.warn('chart init failed',e)}
  }

  function randomArray(n,min,max){
    return Array.from({length:n},()=>Math.floor(Math.random()*(max-min+1))+min);
  }

  // Exposed functions called by template
  window.updateChart = function(type,range){
    if(type==='area' && areaChart){
      areaChart.data.datasets[0].data = randomArray(areaChart.data.labels.length,30,260);
      areaChart.update();
    }
    if(type==='pie' && pieChart){
      pieChart.data.datasets[0].data = randomArray(pieChart.data.labels.length,5,80);
      pieChart.update();
    }
  };

  window.exportData = function(format){
    // simple export: create CSV of top cards numbers
    try{
      const cards = document.querySelectorAll('.card .card-body .h5');
      const rows = [];
      cards.forEach(c=>rows.push([ (c.textContent||'').trim() ]));
      const csv = rows.map(r=>r.join(',')).join('\n');
      const blob = new Blob([csv],{type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `export.${format==='excel'?'csv':'txt'}`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }catch(e){console.warn('export failed',e)}
  };

  window.refreshCareerData = function(){
    // refresh cards with new random values
    document.querySelectorAll('.card.bg-primary .h5').forEach(el=>el.childNodes[0].nodeValue = Math.floor(Math.random()*400));
    document.querySelectorAll('.card.bg-success .h5').forEach(el=>el.childNodes[0].nodeValue = Math.floor(Math.random()*60));
  };

  // Export helpers for specific sections
  window.exportCareerData = function(){
    // export career table to CSV
    const table = document.getElementById('careerTable');
    if(!table) return exportData('excel');
    exportTableToCSV(table, 'careers.csv');
  };

  window.exportStudentData = function(){
    const table = document.getElementById('studentTable');
    if(!table) return exportData('excel');
    exportTableToCSV(table, 'students.csv');
  };

  window.exportActivityData = function(){
    // simple export of activity timeline text
    const items = Array.from(document.querySelectorAll('.timeline-item')).map(i=>i.innerText.trim().replace(/\s+/g,' '));
    const blob = new Blob([items.join('\n')], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activity.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  function exportTableToCSV(table, filename){
    try{
      const rows = Array.from(table.querySelectorAll('tr')).map(r=>Array.from(r.querySelectorAll('th,td')).map(c=>`"${(c.innerText||'').trim().replace(/"/g,'""')}"`).join(','));
      const csv = rows.join('\n');
      const blob = new Blob([csv],{type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }catch(e){console.warn('export table failed',e)}
  }

  // Student-related helpers
  window.refreshStudentData = function(){
    // randomize progress bars in student table
    document.querySelectorAll('#studentTable tbody tr').forEach(tr=>{
      const prog = tr.querySelector('.progress-bar');
      if(prog){ const val = Math.floor(Math.random()*30)+60; prog.style.width = val + '%'; prog.setAttribute('aria-valuenow', val); const span = tr.querySelector('td > div span') || tr.querySelector('td span'); if(span) span.textContent = val + '%'; }
    });
  };

  window.viewStudentDetails = function(name){
    alert('View details for: ' + name);
  };

  window.editStudent = function(name){
    const newName = prompt('Edit student name:', name);
    if(!newName) return;
    // update first matching row
    const row = Array.from(document.querySelectorAll('#studentTable tbody tr')).find(r=>r.innerText.toLowerCase().includes(name.toLowerCase()));
    if(row){ row.querySelector('.fw-bold').textContent = newName; }
  };

  window.rerunAssessment = function(name){
    // simulate rerun by randomizing that student's progress
    const row = Array.from(document.querySelectorAll('#studentTable tbody tr')).find(r=>r.innerText.toLowerCase().includes(name.toLowerCase()));
    if(row){ const prog = row.querySelector('.progress-bar'); if(prog){ const val = Math.floor(Math.random()*30)+60; prog.style.width = val + '%'; prog.setAttribute('aria-valuenow', val); const span = row.querySelector('td > div span') || row.querySelector('td span'); if(span) span.textContent = val + '%'; alert('Re-ran assessment for ' + name); } }
  };

  window.deleteStudent = function(name){
    if(!confirm('Delete student ' + name + '?')) return;
    const row = Array.from(document.querySelectorAll('#studentTable tbody tr')).find(r=>r.innerText.toLowerCase().includes(name.toLowerCase()));
    if(row){ row.remove(); }
  };

  // Activity helpers
  window.refreshActivityData = function(){
    // no backend; shuffle timestamps for demo
    const items = Array.from(document.querySelectorAll('.timeline-item'));
    items.forEach(i=>{ const t = i.querySelector('.text-muted'); if(t) t.textContent = ['Just now','5m ago','2h ago','1d ago'][Math.floor(Math.random()*4)]; });
  };

  window.clearActivityData = function(){
    const wrap = document.querySelector('.timeline'); if(wrap) wrap.innerHTML = '<p class="text-muted p-3">No recent activity.</p>';
  };

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    loadUserProfile();
    setupSidebarToggle();
    loadFeather();
    setupCharts();
    setupFactsAndRules();
  });

  // allow normal navigation to facts/rules pages (removed scroll interception)

  // Facts & Rules UI injection and API calls
  function setupFactsAndRules(){
    try{
      const target = document.querySelector('.content .container-fluid');
      if(!target) return;

      const container = document.createElement('div');
      container.className = 'row mb-4';
      container.innerHTML = `
        <div class="col-12 mb-3">
            <div class="input-group">
                <span class="input-group-text">Search</span>
                <input type="text" id="dashboardSearch" class="form-control" placeholder="Filter facts and rules...">
            </div>
        </div>
        <div class="col-lg-6">
          <div class="card mb-4">
            <div class="card-header">Facts (add math, programming, thinking...)</div>
            <div class="card-body" id="facts-card">
              <form id="factForm" class="mb-3">
                <input type="hidden" name="fact_id" id="factId">
                <div class="d-flex gap-2 mb-2">
                    <input name="category" id="factCategory" class="form-control" placeholder="Category" required />
                    <input name="content" id="factContent" class="form-control" placeholder="Fact content" required />
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" type="submit" id="factSubmitBtn">Add</button>
                    <button class="btn btn-secondary" type="button" id="factCancelBtn" style="display:none;">Cancel</button>
                </div>
              </form>
              <ul id="factsList" class="list-group"></ul>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card mb-4">
            <div class="card-header">Rules (domain: it, software, networking...)</div>
            <div class="card-body" id="rules-card">
              <form id="ruleForm" class="mb-3">
                <input type="hidden" name="rule_id" id="ruleId">
                <div class="d-flex gap-2 mb-2">
                    <input name="domain" id="ruleDomain" class="form-control" placeholder="Domain" required />
                    <input name="title" id="ruleTitle" class="form-control" placeholder="Rule title" required />
                </div>
                <input name="description" id="ruleDescription" class="form-control mb-2" placeholder="Description (optional)" />
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" type="submit" id="ruleSubmitBtn">Add</button>
                    <button class="btn btn-secondary" type="button" id="ruleCancelBtn" style="display:none;">Cancel</button>
                </div>
              </form>
              <ul id="rulesList" class="list-group"></ul>
            </div>
          </div>
        </div>
      `;

      // insert after header row (at top of main content)
      target.insertBefore(container, target.firstChild);

      // Search filter logic
      document.getElementById('dashboardSearch').addEventListener('keyup', function(e){
        const term = e.target.value.toLowerCase();
        const filterList = (listId) => {
            document.querySelectorAll('#' + listId + ' li').forEach(li => {
                const text = li.textContent.toLowerCase();
                li.style.display = text.includes(term) ? '' : 'none';
            });
        };
        filterList('factsList');
        filterList('rulesList');
      });

      // wire up forms
      document.getElementById('factForm').addEventListener('submit', function(e){
        e.preventDefault();
        const id = document.getElementById('factId').value;
        const category = document.getElementById('factCategory').value;
        const content = document.getElementById('factContent').value;
        
        const url = id ? `/api/facts/${id}` : '/api/facts';
        const method = id ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({category, content})
        })
        .then(r=>r.json())
        .then(()=>{ 
            e.target.reset(); 
            document.getElementById('factId').value = '';
            document.getElementById('factSubmitBtn').textContent = 'Add';
            document.getElementById('factCancelBtn').style.display = 'none';
            loadFacts(); 
        }).catch(()=>{});
      });

      document.getElementById('ruleForm').addEventListener('submit', function(e){
        e.preventDefault();
        const id = document.getElementById('ruleId').value;
        const domain = document.getElementById('ruleDomain').value;
        const title = document.getElementById('ruleTitle').value;
        const description = document.getElementById('ruleDescription').value;
        
        const url = id ? `/api/rules/${id}` : '/api/rules';
        const method = id ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({domain, title, description})
        })
        .then(r=>r.json())
        .then(()=>{ 
            e.target.reset(); 
            document.getElementById('ruleId').value = '';
            document.getElementById('ruleSubmitBtn').textContent = 'Add';
            document.getElementById('ruleCancelBtn').style.display = 'none';
            loadRules(); 
        }).catch(()=>{});
      });

      // Cancel buttons
      document.getElementById('factCancelBtn').addEventListener('click', function(){
        document.getElementById('factForm').reset();
        document.getElementById('factId').value = '';
        document.getElementById('factSubmitBtn').textContent = 'Add';
        this.style.display = 'none';
      });
      
      document.getElementById('ruleCancelBtn').addEventListener('click', function(){
        document.getElementById('ruleForm').reset();
        document.getElementById('ruleId').value = '';
        document.getElementById('ruleSubmitBtn').textContent = 'Add';
        this.style.display = 'none';
      });

      // Event delegation for Edit/Delete
      document.addEventListener('click', function(e){
        // Facts
        if(e.target.closest('.btn-delete-fact')){
            const id = e.target.closest('.btn-delete-fact').dataset.id;
            if(confirm('Delete this fact?')) {
                fetch('/api/facts/' + id, {method: 'DELETE'})
                .then(r => { if(r.ok) loadFacts(); else alert('Failed to delete fact'); })
                .catch(e => console.error(e));
            }
        }
        if(e.target.closest('.btn-edit-fact')){
            const btn = e.target.closest('.btn-edit-fact');
            document.getElementById('factId').value = btn.dataset.id;
            document.getElementById('factCategory').value = btn.dataset.category;
            document.getElementById('factContent').value = btn.dataset.content;
            document.getElementById('factSubmitBtn').textContent = 'Update';
            document.getElementById('factCancelBtn').style.display = 'inline-block';
        }
        
        // Rules
        if(e.target.closest('.btn-delete-rule')){
            const id = e.target.closest('.btn-delete-rule').dataset.id;
            if(confirm('Delete this rule?')) {
                fetch('/api/rules/' + id, {method: 'DELETE'})
                .then(r => { if(r.ok) loadRules(); else alert('Failed to delete rule'); })
                .catch(e => console.error(e));
            }
        }
        if(e.target.closest('.btn-edit-rule')){
            const btn = e.target.closest('.btn-edit-rule');
            document.getElementById('ruleId').value = btn.dataset.id;
            document.getElementById('ruleDomain').value = btn.dataset.domain;
            document.getElementById('ruleTitle').value = btn.dataset.title;
            document.getElementById('ruleDescription').value = btn.dataset.description;
            document.getElementById('ruleSubmitBtn').textContent = 'Update';
            document.getElementById('ruleCancelBtn').style.display = 'inline-block';
        }
      });

      // load initial data
      loadFacts();
      loadRules();
    }catch(e){console.warn('facts ui failed',e)}
  }

  function loadFacts(){
    fetch('/api/facts').then(r=>r.json()).then(data=>{
      const ul = document.getElementById('factsList'); if(!ul) return;
      ul.innerHTML = '';
      data.forEach(f=>{
        const li = document.createElement('li'); li.className='list-group-item';
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span><strong>${f.category}:</strong> ${f.content}</span>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-secondary btn-edit-fact" data-id="${f.id}" data-category="${f.category}" data-content="${f.content.replace(/"/g, '&quot;')}"><i data-feather="edit-2"></i> Edit</button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-fact" data-id="${f.id}"><i data-feather="trash-2"></i></button>
                </div>
            </div>
        `;
        ul.appendChild(li);
      });
      if(window.feather) window.feather.replace();
      // update counts on page when facts change
      updateCounts();
      // Re-apply search filter if active
      const search = document.getElementById('dashboardSearch');
      if(search && search.value) search.dispatchEvent(new Event('keyup'));
    }).catch(()=>{});
  }

  function loadRules(){
    fetch('/api/rules').then(r=>r.json()).then(data=>{
      const ul = document.getElementById('rulesList'); if(!ul) return;
      ul.innerHTML = '';
      data.forEach(r=>{
        const li = document.createElement('li'); li.className='list-group-item';
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span><strong>${r.domain}:</strong> ${r.title} <small class="text-muted">${r.description || ''}</small></span>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-secondary btn-edit-rule" data-id="${r.id}" data-domain="${r.domain}" data-title="${r.title}" data-description="${(r.description||'').replace(/"/g, '&quot;')}"><i data-feather="edit-2"></i> Edit</button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-rule" data-id="${r.id}"><i data-feather="trash-2"></i></button>
                </div>
            </div>
        `;
        ul.appendChild(li);
      });
      if(window.feather) window.feather.replace();
      // update counts on page when rules change
      updateCounts();
      // Re-apply search filter if active
      const search = document.getElementById('dashboardSearch');
      if(search && search.value) search.dispatchEvent(new Event('keyup'));
    }).catch(()=>{});
  }

  // Update dashboard stat cards using API counts
  function updateCounts(){
    // facts
    fetch('/api/facts').then(r=>r.json()).then(f=>{
      const cards = Array.from(document.querySelectorAll('.card'));
      const factsCard = cards.find(c=>/total\s+facts/i.test(c.innerText));
      if(factsCard){
        const val = factsCard.querySelector('.card-stats-value') || factsCard.querySelector('.h5');
        if(val) val.textContent = f.length;
      }
    }).catch(()=>{});

    // rules
    fetch('/api/rules').then(r=>r.json()).then(rules=>{
      const cards = Array.from(document.querySelectorAll('.card'));
      const rulesCard = cards.find(c=>/total\s+rules/i.test(c.innerText));
      if(rulesCard){
        const val = rulesCard.querySelector('.card-stats-value') || rulesCard.querySelector('.h5');
        if(val) val.textContent = rules.length;
      }
    }).catch(()=>{});
  }

  // listen for changes from other tabs/pages
  window.addEventListener('storage', function(e){
    if(e.key === 'facts_updated' || e.key === 'rules_updated') updateCounts();
  });

})();
