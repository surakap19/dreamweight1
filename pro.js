/* ആരോഗ്യ പവർ — Pro Weight Manager extensions */
(function () {
  const QUICK_FOODS = [
    { name: 'വേവിച്ച മുട്ട', cal: 78 },
    { name: 'ചോറ് (1 കപ്പ്)', cal: 200 },
    { name: 'ചപ്പാത്തി', cal: 120 },
    { name: 'ബനാന', cal: 105 },
    { name: 'പാല് (1 ഗ്ലാസ്)', cal: 150 },
    { name: 'ചിക്കൻ ഗ്രിൽ', cal: 180 },
    { name: 'ഓട്സ് ബൗൽ', cal: 250 },
    { name: 'ഗ്രീൻ ടീ', cal: 2 }
  ];

  const MEAL_LABELS = { breakfast: '🌅 പ്രഭാതം', lunch: '☀️ ഉച്ച', snack: '🍎 സ്നാക്ക്', dinner: '🌙 രാത്രി' };

  let healthProfile = JSON.parse(localStorage.getItem('healthProfile') || '{}');
  let foodLogs = JSON.parse(localStorage.getItem('foodLogs') || '{}');
  let measurements = JSON.parse(localStorage.getItem('measurements') || '[]');
  let activityDates = JSON.parse(localStorage.getItem('activityDates') || '[]');

  function todayKey() {
    return new Date().toISOString().split('T')[0];
  }

  function $(id) {
    return document.getElementById(id);
  }

  function showToast(msg) {
    const c = $('toastContainer');
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function logActivity() {
    const d = todayKey();
    if (!activityDates.includes(d)) {
      activityDates.push(d);
      localStorage.setItem('activityDates', JSON.stringify(activityDates));
    }
  }

  function calcStreak() {
    const set = new Set(activityDates);
    let streak = 0;
    const d = new Date();
    while (true) {
      const k = d.toISOString().split('T')[0];
      if (!set.has(k)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function getTodayFood() {
    const key = todayKey();
    if (!foodLogs[key]) foodLogs[key] = [];
    return foodLogs[key];
  }

  function getFoodTotal() {
    return getTodayFood().reduce((s, e) => s + (e.cal || 0), 0);
  }

  function getCalTarget() {
    if (typeof savedCalGoal === 'number' && savedCalGoal) return savedCalGoal;
    if (healthProfile.calGoal) return healthProfile.calGoal;
    return null;
  }

  function getCurrentWeight() {
    if (weightLogs.length) return weightLogs[weightLogs.length - 1].weight;
    const w = parseFloat(healthProfile.weight);
    return isNaN(w) ? null : w;
  }

  function saveProfile() {
    healthProfile = {
      name: $('profile-name')?.value?.trim() || '',
      gender: $('profile-gender')?.value || 'male',
      age: parseFloat($('profile-age')?.value) || null,
      weight: parseFloat($('profile-weight')?.value) || null,
      height: parseFloat($('profile-height')?.value) || null,
      activity: $('profile-activity')?.value || '1.375',
      goal: $('profile-goal')?.value || 'loss',
      startWeight: parseFloat($('profile-start-weight')?.value) || null,
      targetWeight: parseFloat($('profile-target-weight')?.value) || null,
      weeklyRate: parseFloat($('profile-weekly-rate')?.value) || 0.5,
      targetDate: $('profile-target-date')?.value || '',
      notes: $('profile-notes')?.value || '',
      calGoal: getCalTarget()
    };
    localStorage.setItem('healthProfile', JSON.stringify(healthProfile));
    if (healthProfile.goal) currentGoal = healthProfile.goal;
    if (healthProfile.calGoal) savedCalGoal = healthProfile.calGoal;
    logActivity();
    syncProfileToForms();
    updateDashboard();
    showToast('പ്രൊഫൈൽ സേവ് ചെയ്തു!');
  }

  function loadProfileForm() {
    const p = healthProfile;
    if ($('profile-name')) $('profile-name').value = p.name || '';
    if ($('profile-gender')) $('profile-gender').value = p.gender || 'male';
    if ($('profile-age')) $('profile-age').value = p.age || '';
    if ($('profile-weight')) $('profile-weight').value = p.weight || '';
    if ($('profile-height')) $('profile-height').value = p.height || '';
    if ($('profile-activity')) $('profile-activity').value = p.activity || '1.375';
    if ($('profile-goal')) $('profile-goal').value = p.goal || 'loss';
    if ($('profile-start-weight')) $('profile-start-weight').value = p.startWeight || '';
    if ($('profile-target-weight')) $('profile-target-weight').value = p.targetWeight || '';
    if ($('profile-weekly-rate')) $('profile-weekly-rate').value = String(p.weeklyRate || 0.5);
    if ($('profile-target-date')) $('profile-target-date').value = p.targetDate || '';
    if ($('profile-notes')) $('profile-notes').value = p.notes || '';
    if ($('profileAvatar') && p.name) $('profileAvatar').textContent = p.name.charAt(0).toUpperCase();
  }

  function syncProfileToForms() {
    const p = healthProfile;
    const map = [
      ['gender', 'gender'], ['age', 'age'], ['weight', 'weight'], ['height', 'height'],
      ['activity', 'activity'], ['macro-gender', 'gender'], ['macro-age', 'age'],
      ['macro-weight', 'weight'], ['macro-height', 'height'], ['bmi-weight', 'weight'],
      ['bmi-height', 'height'], ['bmi-gender', 'gender'], ['water-weight', 'weight'],
      ['ex-weight', 'weight']
    ];
    map.forEach(([field, key]) => {
      const el = $(field);
      if (el && p[key] != null && p[key] !== '') el.value = p[key];
    });
    if (p.goal) {
      currentGoal = p.goal;
      const btn = document.querySelector(`#goalToggle .goal-btn.active-${p.goal === 'maintain' ? 'maintain' : p.goal}`);
      if (btn && typeof setGoal === 'function') setGoal(p.goal, btn);
    }
    if (typeof calcWaterGoal === 'function') calcWaterGoal();
    if (typeof updateExerciseCals === 'function') updateExerciseCals();
    showToast('ഫോമുകളിലേക്ക് സിങ്ക് ചെയ്തു');
  }

  function renderQuickFoodChips() {
    const el = $('quickFoodChips');
    if (!el) return;
    el.innerHTML = QUICK_FOODS.map(f =>
      `<button type="button" class="chip" onclick="quickAddFood('${f.name.replace(/'/g, "\\'")}',${f.cal})">${f.name} · ${f.cal}</button>`
    ).join('');
  }

  window.quickAddFood = function (name, cal) {
    if ($('food-name')) $('food-name').value = name;
    if ($('food-cal')) $('food-cal').value = cal;
    addFoodEntry();
  };

  window.addFoodEntry = function () {
    const name = $('food-name')?.value?.trim();
    const cal = parseInt($('food-cal')?.value, 10);
    const meal = $('food-meal')?.value || 'snack';
    if (!name || !cal) {
      showToast('ഭക്ഷണത്തിന്റെ പേരും കലോറിയും നൽകൂ');
      return;
    }
    getTodayFood().push({ name, cal, meal, time: Date.now() });
    localStorage.setItem('foodLogs', JSON.stringify(foodLogs));
    if ($('food-name')) $('food-name').value = '';
    if ($('food-cal')) $('food-cal').value = '';
    logActivity();
    renderFoodLog();
    updateDashboard();
    showToast('ഭക്ഷണം ചേർത്തു');
  };

  window.clearTodayFood = function () {
    if (!confirm('ഇന്നത്തെ ഭക്ഷണ ലോഗ് മായ്ക്കണോ?')) return;
    foodLogs[todayKey()] = [];
    localStorage.setItem('foodLogs', JSON.stringify(foodLogs));
    renderFoodLog();
    updateDashboard();
    showToast('ലോഗ് മായ്ച്ചു');
  };

  function renderFoodLog() {
    const list = $('foodList');
    const items = getTodayFood();
    const target = getCalTarget();
    const total = getFoodTotal();
    const key = todayKey();

    if ($('foodDateBadge')) $('foodDateBadge').textContent = key;
    if ($('foodTotal')) $('foodTotal').textContent = total;
    if ($('foodTarget')) $('foodTarget').textContent = target ? target : '—';
    if ($('foodRemaining')) {
      $('foodRemaining').textContent = target ? Math.max(0, target - total) + ' kcal' : '—';
      $('foodRemaining').style.color = target && total > target ? 'var(--red)' : 'var(--green)';
    }
    const bar = $('foodBar');
    if (bar && target) {
      const pct = Math.min(100, Math.round((total / target) * 100));
      bar.style.width = pct + '%';
      bar.classList.toggle('over', total > target);
    }

    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">ഇതുവരെ ഒന്നും ചേർത്തിട്ടില്ല</p>';
      return;
    }
    list.innerHTML = items.map((e, i) => `
      <div class="food-item">
        <span class="food-meal-badge">${MEAL_LABELS[e.meal] || e.meal}</span>
        <div style="flex:1"><div class="meal-name">${e.name}</div></div>
        <div class="meal-cal">${e.cal} cal</div>
        <button class="del-btn" onclick="removeFoodEntry(${i})">🗑️</button>
      </div>
    `).join('');
  }

  window.removeFoodEntry = function (i) {
    getTodayFood().splice(i, 1);
    localStorage.setItem('foodLogs', JSON.stringify(foodLogs));
    renderFoodLog();
    updateDashboard();
  };

  window.addMeasurement = function () {
    const waist = parseFloat($('meas-waist')?.value);
    const chest = parseFloat($('meas-chest')?.value);
    const hips = parseFloat($('meas-hips')?.value);
    if (!waist && !chest && !hips) {
      showToast('കുറഞ്ഞത് ഒരു അളവ് നൽകൂ');
      return;
    }
    measurements.push({ date: todayKey(), waist, chest, hips });
    localStorage.setItem('measurements', JSON.stringify(measurements));
    if ($('meas-waist')) $('meas-waist').value = '';
    if ($('meas-chest')) $('meas-chest').value = '';
    if ($('meas-hips')) $('meas-hips').value = '';
    logActivity();
    renderMeasurements();
    showToast('അളവ് ചേർത്തു');
  };

  function renderMeasurements() {
    const el = $('measList');
    if (!el) return;
    if (!measurements.length) {
      el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:12px">അളവുകൾ ഇല്ല</p>';
      return;
    }
    el.innerHTML = measurements.slice().reverse().map((m, i) => `
      <div class="log-item">
        <span class="log-date">${formatDate(m.date)}</span>
        <span class="log-weight">${[m.waist && 'ഇടപ്പ് '+m.waist, m.chest && 'നെഞ്ച് '+m.chest, m.hips && 'ഇടுப்ப് '+m.hips].filter(Boolean).join(' · ')}</span>
        <button class="del-btn" onclick="removeMeasurement(${measurements.length - 1 - i})">🗑️</button>
      </div>
    `).join('');
  }

  window.removeMeasurement = function (i) {
    measurements.splice(i, 1);
    localStorage.setItem('measurements', JSON.stringify(measurements));
    renderMeasurements();
  };

  function updateCalorieBalance() {
    const total = getFoodTotal();
    const target = getCalTarget();
    if ($('dash-food')) $('dash-food').textContent = total;
    if ($('dashCalEaten')) $('dashCalEaten').textContent = total;
    if ($('dashCalTarget')) $('dashCalTarget').textContent = target || '—';
    const bar = $('dashCalBar');
    if (bar && target) {
      const pct = Math.min(100, Math.round((total / target) * 100));
      bar.style.width = pct + '%';
      bar.classList.toggle('over', total > target);
    }
    if ($('dashCalRemain')) {
      if (!target) $('dashCalRemain').textContent = 'കലോറി കണക്കാക്കുക അല്ലെങ്കിൽ പ്രൊഫൈൽ സേവ് ചെയ്യുക';
      else {
        const rem = target - total;
        $('dashCalRemain').textContent = rem >= 0
          ? `ഇന്ന് ഇനിയും ${rem} kcal കഴിക്കാം`
          : `${Math.abs(rem)} kcal ലക്ഷ്യത്തിന് മീതെ`;
        $('dashCalRemain').style.color = rem >= 0 ? 'var(--text-muted)' : 'var(--red)';
      }
    }
  }

  function updateGoalProgress() {
    const start = healthProfile.startWeight || (weightLogs[0]?.weight);
    const target = healthProfile.targetWeight;
    const current = getCurrentWeight();
    const card = $('goalProgressCard');
    if (!card || !start || !target || current == null) {
      if (card) card.style.display = 'none';
      return;
    }
    card.style.display = 'block';
    const isLoss = target < start;
    const total = Math.abs(start - target);
    const done = isLoss ? start - current : current - start;
    const pct = Math.min(100, Math.max(0, Math.round((done / total) * 100)));
    const remaining = Math.abs(current - target).toFixed(1);

    if ($('goalPct')) $('goalPct').textContent = pct + '%';
    if ($('dash-start-w')) $('dash-start-w').textContent = start + ' kg';
    if ($('dash-target-w')) $('dash-target-w').textContent = target + ' kg';
    if ($('dash-current-w')) $('dash-current-w').textContent = current + ' kg';
    if ($('dash-remaining-w')) $('dash-remaining-w').textContent = remaining + ' kg';

    const ring = $('goalRing');
    if (ring) {
      const circ = 326.7;
      ring.style.strokeDashoffset = String(circ - (pct / 100) * circ);
    }

    const rate = parseFloat(healthProfile.weeklyRate) || 0.5;
    const weeks = rate > 0 ? Math.ceil(parseFloat(remaining) / rate) : '—';
    if ($('dash-eta')) {
      $('dash-eta').textContent = typeof weeks === 'number'
        ? `≈ ${weeks} ആഴ്ച (${rate} kg/ആഴ്ച)`
        : '—';
    }

    renderAchievements(pct, current);
  }

  function renderAchievements(pct, current) {
    const el = $('achievementChips');
    if (!el) return;
    const chips = [];
    if (weightLogs.length >= 1) chips.push({ t: '📝 ആദ്യ ലോഗ്', on: true });
    if (weightLogs.length >= 5) chips.push({ t: '📊 5 ലോഗുകൾ', on: true });
    if (calcStreak() >= 3) chips.push({ t: '🔥 3 ദിവസ സ്ട്രീക്ക്', on: true });
    if (calcStreak() >= 7) chips.push({ t: '🏆 7 ദിവസ സ്ട്രീക്ക്', on: true });
    if (pct >= 50) chips.push({ t: '🎯 50% ലക്ഷ്യം', on: true });
    if (pct >= 100) chips.push({ t: '✨ ലക്ഷ്യം നേടി!', on: true });
    if (getFoodTotal() > 0) chips.push({ t: '🍽️ ഭക്ഷണ ട്രാക്ക്', on: true });
    el.innerHTML = chips.map(c => `<span class="chip active">${c.t}</span>`).join('') ||
      '<span class="chip">ലോഗ് ചെയ്താൽ ബാഡ്ജുകൾ കാണാം</span>';
  }

  function updateDashboard() {
    if (healthProfile.name && $('dashWelcome')) {
      $('dashWelcome').textContent = '👋 ' + healthProfile.name + '!';
    }
    if (healthProfile.calGoal && $('dash-cal')) {
      $('dash-cal').textContent = healthProfile.calGoal;
      savedCalGoal = healthProfile.calGoal;
    }
    if ($('dash-streak')) $('dash-streak').textContent = calcStreak();
    updateCalorieBalance();
    updateGoalProgress();
  }

  window.generateWeeklyReport = function () {
    const el = $('weeklyReport');
    if (!el) return;
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLogs = weightLogs.filter(l => new Date(l.date) >= weekAgo);
    const weekFoodDays = Object.keys(foodLogs).filter(d => {
      const dt = new Date(d);
      return dt >= weekAgo && foodLogs[d].length;
    }).length;
    const weightChange = weekLogs.length >= 2
      ? (weekLogs[weekLogs.length - 1].weight - weekLogs[0].weight).toFixed(1)
      : '—';
    const avgCal = (() => {
      let sum = 0, n = 0;
      Object.keys(foodLogs).forEach(d => {
        if (new Date(d) >= weekAgo && foodLogs[d].length) {
          sum += foodLogs[d].reduce((s, e) => s + e.cal, 0);
          n++;
        }
      });
      return n ? Math.round(sum / n) : '—';
    })();

    el.innerHTML = `
      <div class="report-item"><div class="val">${weekLogs.length}</div><div class="lbl">ഭാരം ലോഗുകൾ</div></div>
      <div class="report-item"><div class="val">${weightChange}</div><div class="lbl">kg മാറ്റം</div></div>
      <div class="report-item"><div class="val">${weekFoodDays}</div><div class="lbl">ഭക്ഷണ ദിവസങ്ങൾ</div></div>
      <div class="report-item"><div class="val">${avgCal}</div><div class="lbl">ശരാശരി kcal</div></div>
      <div class="report-item"><div class="val">${calcStreak()}</div><div class="lbl">സ്ട്രീക്ക്</div></div>
      <div class="report-item"><div class="val">${waterCount}/8</div><div class="lbl">വെള്ളം ഇന്ന്</div></div>
    `;
  };

  window.exportData = function () {
    const data = {
      healthProfile, foodLogs, weightLogs, measurements, activityDates,
      exportedAt: new Date().toISOString()
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'aarogya-power-backup.json';
    a.click();
    showToast('ഡാറ്റ എക്സ്പോർട്ട് ചെയ്തു');
  };

  window.importData = function (ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.healthProfile) { healthProfile = data.healthProfile; localStorage.setItem('healthProfile', JSON.stringify(healthProfile)); }
        if (data.foodLogs) { foodLogs = data.foodLogs; localStorage.setItem('foodLogs', JSON.stringify(foodLogs)); }
        if (data.weightLogs) { weightLogs = data.weightLogs; localStorage.setItem('weightLogs', JSON.stringify(weightLogs)); }
        if (data.measurements) { measurements = data.measurements; localStorage.setItem('measurements', JSON.stringify(measurements)); }
        if (data.activityDates) { activityDates = data.activityDates; localStorage.setItem('activityDates', JSON.stringify(activityDates)); }
        loadProfileForm();
        renderFoodLog();
        if (typeof renderWeightLog === 'function') renderWeightLog();
        renderMeasurements();
        updateDashboard();
        generateWeeklyReport();
        showToast('ഇംപോർട്ട് വിജയം');
      } catch (e) {
        showToast('ഫയൽ വായിക്കാൻ കഴിഞ്ഞില്ല');
      }
      ev.target.value = '';
    };
    reader.readAsText(file);
  };

  window.resetAllData = function () {
    if (!confirm('എല്ലാ ഡാറ്റയും ശാശ്വതമായി മായ്ക്കണോ?')) return;
    ['healthProfile', 'foodLogs', 'measurements', 'activityDates', 'weightLogs'].forEach(k => localStorage.removeItem(k));
    Object.keys(localStorage).filter(k => k.startsWith('water_')).forEach(k => localStorage.removeItem(k));
    healthProfile = {}; foodLogs = {}; measurements = []; activityDates = []; weightLogs = [];
    localStorage.setItem('weightLogs', '[]');
    waterCount = 0;
    loadProfileForm();
    renderFoodLog();
    if (typeof renderWeightLog === 'function') renderWeightLog();
    renderMeasurements();
    loadWaterToday();
    updateDashboard();
    showToast('ഡാറ്റ മായ്ച്ചു');
  };

  function loadWaterToday() {
    waterCount = parseInt(localStorage.getItem('water_' + todayKey()) || '0', 10);
    if (typeof renderWaterCups === 'function') renderWaterCups();
    if (typeof updateWaterDash === 'function') updateWaterDash();
  }

  function saveWaterToday() {
    localStorage.setItem('water_' + todayKey(), String(waterCount));
  }

  function wrapExisting() {
    const origShow = window.showSection;
    window.showSection = function (id) {
      origShow(id);
      if (id === 'foodlog') renderFoodLog();
      if (id === 'profile') { loadProfileForm(); renderMeasurements(); generateWeeklyReport(); }
      if (id === 'dashboard') updateDashboard();
    };

    const origCal = window.calculateCalories;
    window.calculateCalories = function () {
      origCal();
      healthProfile.calGoal = savedCalGoal;
      healthProfile.goal = currentGoal;
      localStorage.setItem('healthProfile', JSON.stringify(healthProfile));
      logActivity();
      updateDashboard();
    };

    const origBmi = window.calculateBMI;
    window.calculateBMI = function () {
      origBmi();
      const age = parseFloat($('profile-age')?.value || healthProfile.age);
      const bmi = parseFloat($('dash-bmi')?.textContent);
      if (!isNaN(bmi) && age) {
        const g = ($('bmi-gender')?.value || healthProfile.gender) === 'male' ? 1 : 0;
        const bf = (1.2 * bmi + 0.23 * age - 10.8 * g - 5.4).toFixed(1);
        const box = $('bmiResult');
        if (box && !box.innerHTML.includes('ശരീര കൊഴുപ്പ്')) {
          box.innerHTML += `<div class="result-row" style="margin-top:12px"><span>📐 ശരീര കൊഴുപ്പ് (ഏകദേശം)</span><span class="val" style="color:var(--purple)">${bf}%</span></div>`;
        }
      }
      logActivity();
    };

    const origWeight = window.addWeightLog;
    window.addWeightLog = function () {
      origWeight();
      logActivity();
      const last = weightLogs[weightLogs.length - 1];
      if (last && !healthProfile.startWeight && weightLogs.length === 1) {
        healthProfile.startWeight = last.weight;
        localStorage.setItem('healthProfile', JSON.stringify(healthProfile));
      }
      updateDashboard();
      showToast('ഭാരം രേഖപ്പെടുത്തി');
    };

    const origAddWater = window.addWater;
    window.addWater = function () {
      origAddWater();
      saveWaterToday();
      logActivity();
    };

    const origResetWater = window.resetWater;
    window.resetWater = function () {
      origResetWater();
      saveWaterToday();
    };

    const origRenderWater = window.renderWaterCups;
    window.renderWaterCups = function () {
      origRenderWater();
      saveWaterToday();
    };
  }

  window.saveProfile = saveProfile;
  window.syncProfileToForms = syncProfileToForms;

  function initPro() {
    if (healthProfile.calGoal) savedCalGoal = healthProfile.calGoal;
    if (healthProfile.goal) currentGoal = healthProfile.goal;
    loadProfileForm();
    loadWaterToday();
    renderQuickFoodChips();
    renderFoodLog();
    wrapExisting();
    updateDashboard();
    generateWeeklyReport();
  }

  initPro();
})();
