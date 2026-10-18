document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const isAuthPage = ['login.html', 'forgot-password.html', 'signup.html'].includes(currentPage);

    if (!isAuthPage) {
        const dashboardLink = document.querySelector('.nav-login-btn, .nav-cta');
        const nav = document.querySelector('.navbar');
        const host = dashboardLink?.parentElement || nav;
        if (host && !document.querySelector('.level-selector-link')) {
            const levelLink = document.createElement('a');
            levelLink.href = 'index.html#level-selector';
            levelLink.className = 'level-selector-link';
            levelLink.innerHTML = '<i class="ri-graduation-cap-line"></i><span>Choose Class</span>';
            host.insertBefore(levelLink, dashboardLink || null);
        }
    }

    const selector = document.getElementById('learning-level');
    const featuredGrid = document.getElementById('featured-batches-grid');
    const featuredTitle = document.getElementById('featured-batches-title');
    const featuredCopy = document.getElementById('featured-batches-copy');
    const competitionGrid = document.getElementById('competition-grid');
    const competitionTitle = document.getElementById('competitions-title');
    const competitionCopy = document.getElementById('competitions-copy');
    const competitiveSection = document.getElementById('jee-neet');
    const competitiveLinks = document.querySelectorAll('a[href="#jee-neet"]');
    const competitiveMenuCategory = document.querySelector('.mega-cat[data-panel="competitive"]');
    const competitiveMenuPanel = document.getElementById('panel-competitive');

    if (!selector || !featuredGrid || !competitionGrid) return;

    const paths = {
        class: {
            title: value => `Narayan e-Gurukul provides expert courses built for ${value} students.`,
            copy: value => `Explore expert courses built to enhance your ${value} learning with clear notes, practice work, and confidence-building tests.`,
            batches: value => [
                ['Notes & PDFs', `Subject notes and printable PDFs for ${value}.`, 'ri-file-text-line'],
                ['Practice Work', `English, Science, Maths, and other ${value} practice sets.`, 'ri-book-open-line'],
                ['Mock Tests', `Confidence-building mock tests designed for ${value}.`, 'ri-checkbox-circle-line'],
                ['Competitions', `Olympiads and school opportunities for ${value}.`, 'ri-trophy-line']
            ],
            competitions: value => [
                ['Maths Olympiads', `Problem-solving practice and mock papers for ${value}.`, 'ri-calculator-line'],
                ['Science Quizzes', `Science facts, experiments, and quiz preparation for ${value}.`, 'ri-flask-line'],
                ['English Challenges', `Reading, vocabulary, and communication competitions for ${value}.`, 'ri-book-2-line'],
                ['Creative Opportunities', `Projects, quizzes, and school competitions for ${value}.`, 'ri-lightbulb-line']
            ]
        },
        jee: {
            title: () => 'Expert courses built for JEE preparation.',
            copy: () => 'Build a strong JEE foundation with notes, solved questions, practice sets, and mock tests.',
            batches: () => [['Physics', 'Concept notes, formulas, and problem practice.', 'ri-flask-line'], ['Chemistry', 'Revision notes, reactions, and solved questions.', 'ri-test-tube-line'], ['Mathematics', 'Formula sheets, examples, and timed practice.', 'ri-function-line'], ['Mock Tests', 'JEE-style tests with focused revision support.', 'ri-timer-line']],
            competitions: () => [['JEE Main', 'Structured practice for speed and accuracy.', 'ri-rocket-line'], ['JEE Advanced', 'Higher-level problems and challenge sets.', 'ri-award-line'], ['Scholarships', 'Find academic contests and scholarship opportunities.', 'ri-medal-line'], ['Mock Test Series', 'Track your preparation with regular tests.', 'ri-bar-chart-line']]
        },
        neet: {
            title: () => 'Expert courses built for NEET preparation.',
            copy: () => 'Prepare with Biology, Physics, and Chemistry notes, NCERT support, and mock tests.',
            batches: () => [['Biology', 'NCERT-focused notes and chapter practice.', 'ri-heart-pulse-line'], ['Physics', 'Formula sheets and solved numerical questions.', 'ri-flask-line'], ['Chemistry', 'Organic, inorganic, and physical chemistry revision.', 'ri-test-tube-line'], ['Mock Tests', 'NEET-style tests for exam readiness.', 'ri-timer-line']],
            competitions: () => [['NEET Biology', 'Build accuracy with chapter-wise practice.', 'ri-leaf-line'], ['Science Challenges', 'Explore biology and science competitions.', 'ri-microscope-line'], ['Scholarships', 'Find opportunities for high-performing learners.', 'ri-medal-line'], ['Mock Test Series', 'Practice full-length tests under time limits.', 'ri-bar-chart-line']]
        },
        graduation: {
            title: () => 'Best courses for your graduation journey.',
            copy: () => 'Choose your graduation path now. Detailed B.Tech and other programme pages will be added here next.',
            batches: () => [['B.Tech', 'Engineering study material and branch resources.', 'ri-code-box-line'], ['Computer Science', 'Programming, data structures, and project practice.', 'ri-computer-line'], ['Career Skills', 'Build practical skills for modern careers.', 'ri-briefcase-line'], ['Coming Courses', 'More graduation programmes will be added soon.', 'ri-more-line']],
            competitions: () => [['Projects', 'Practice through guided academic projects.', 'ri-lightbulb-line'], ['Placements', 'Prepare early with skills and interview practice.', 'ri-briefcase-line'], ['Hackathons', 'Find coding and innovation opportunities.', 'ri-code-s-slash-line'], ['Scholarships', 'Explore opportunities for higher education.', 'ri-medal-line']]
        }
    };

    function createCards(items) {
        return items.map(([title, copy, icon]) => `<article class="batch-card"><span class="batch-badge">Featured</span><h3>${title}</h3><p>${copy}</p><i class="${icon}" style="display:block;color:#2563eb;font-size:1.4rem;margin-top:16px"></i></article>`).join('');
    }

    function updatePath() {
        const selected = selector.value;
        const isClass = selected.startsWith('class-');
        const classNumber = isClass ? Number(selected.split('-')[1]) : 0;
        const showCompetitiveContent = !isClass || classNumber >= 8;
        const value = isClass ? `Class ${selected.split('-')[1]}` : selected.toUpperCase();
        const path = isClass ? paths.class : paths[selected];
        if (competitiveSection) competitiveSection.style.display = showCompetitiveContent ? '' : 'none';
        competitiveLinks.forEach(link => { link.style.display = showCompetitiveContent ? '' : 'none'; });
        if (competitiveMenuCategory) competitiveMenuCategory.style.display = showCompetitiveContent ? '' : 'none';
        if (competitiveMenuPanel) competitiveMenuPanel.style.display = showCompetitiveContent ? '' : 'none';
        featuredTitle.textContent = path.title(value);
        featuredCopy.textContent = path.copy(value);
        featuredGrid.innerHTML = createCards(path.batches(value));
        competitionTitle.textContent = isClass ? `${value} opportunities to build your edge.` : `${value} competitions and opportunities.`;
        competitionCopy.textContent = isClass ? `Explore Olympiads, quizzes, science activities, and competitions selected for your class and level.` : path.copy(value);
        competitionGrid.innerHTML = path.competitions(value).map(([title, copy, icon]) => `<article class="competition-card"><i class="${icon}"></i><h3>${title}</h3><p>${copy}</p></article>`).join('');
        document.querySelectorAll('#recommended-courses-title').forEach(title => { title.textContent = `Best Recommended Courses For ${value}`; });
        document.querySelectorAll('.recommended-courses-copy p').forEach(copy => { copy.textContent = path.copy(value); });
    }

    const savedLevel = localStorage.getItem('narayanLearningLevel');
    if (savedLevel === 'neet') localStorage.setItem('narayanLearningLevel', 'class-6');
    const restoredLevel = savedLevel === 'neet' ? 'class-6' : savedLevel;
    if (restoredLevel && selector.querySelector(`option[value="${restoredLevel}"]`)) selector.value = restoredLevel;
    selector.addEventListener('change', () => {
        localStorage.setItem('narayanLearningLevel', selector.value);
        updatePath();
    });
    updatePath();
});
