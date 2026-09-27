/**
 * ==============================================================================
 * 🌾 SMARTPROCURE PUBLIC LANDING PAGE & ENTRY CONTROLLER
 * Digital India • Smart Agriculture • Smart Automation
 * ==============================================================================
 */

let activeAuthCardTab = 'login'; // 'login' | 'register'
let activeAuthRole = 'farmer';    // 'farmer' | 'officer' | 'admin'

/**
 * Render the complete Public Landing Page into #app-view-container
 */
const renderPublicLandingPage = () => {
  const container = document.getElementById('app-view-container');
  if (!container) return;

  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const token = localStorage.getItem('kpms_token');
  const isAuthenticated = !!(user && token);

  container.innerHTML = `
    <div class="sp-landing-wrapper">
      
      <!-- ================================================================ -->
      <!-- 1. HERO SECTION WITH AGRICULTURAL BACKGROUND & AUTH CARD         -->
      <!-- ================================================================ -->
      <section class="sp-public-hero" id="landing-hero">
        <div class="sp-hero-overlay"></div>
        <div class="sp-hero-container">
          <div class="sp-hero-grid">
            
            <!-- Left Hero Content -->
            <div class="sp-hero-content">
              <div class="sp-hero-badges">
                <span class="sp-badge-tagline">
                  <i class="fas fa-seedling"></i> ${getT('hero_badge_tagline', 'Smart Agriculture • Digital Procurement')}
                </span>
              </div>

              <h1 class="sp-hero-title">
                ${getT('hero_title_1', 'Smart Procurement.')}<!-- Smart Procurement.<br /> --><br />
                ${getT('hero_title_2', 'Less Waiting.')}<br />
                <span class="sp-text-highlight">${getT('hero_title_3', 'Better Returns for Farmers.')}</span>
              </h1>

              <p class="sp-hero-desc">
                ${getT('hero_desc_main', 'Find the right procurement centre, book your verified slot, track your live queue position, and monitor direct benefit transfer (DBT) payments — all from one unified government platform.')}
              </p>

              <div class="sp-hero-actions">
                <button class="btn btn-primary btn-lg" onclick="handleHeroMandiCta(${isAuthenticated})">
                  <i class="fas fa-location-crosshairs"></i> ${getT('btn_find_best_mandi', 'Find Best Mandi')}
                </button>
                <button class="btn btn-outline btn-lg sp-btn-hero-secondary" onclick="handleHeroTrackCta(${isAuthenticated})" style="color:#064E3B !important; background:#FFFFFF !important; border:1.5px solid #FFFFFF !important; font-weight:700 !important;">
                  <i class="fas fa-clipboard-check" style="color:#064E3B !important; margin-right:6px;"></i> ${getT('btn_track_procurement', 'Track Procurement')}
                </button>
              </div>

              <!-- Quick Highlights Bar -->
              <div class="sp-hero-quick-stats">
                <div class="sp-quick-stat-item">
                  <div class="sp-stat-icon"><i class="fas fa-clock"></i></div>
                  <div>
                    <strong>${getT('stat_reduced_waiting', 'Reduced Waiting')}</strong>
                    <span>${getT('stat_reduced_waiting_desc', 'Transparent digital token scheduling')}</span>
                  </div>
                </div>
                <div class="sp-quick-stat-item">
                  <div class="sp-stat-icon"><i class="fas fa-shield-alt"></i></div>
                  <div>
                    <strong>${getT('stat_msp_transparency', 'MSP Transparency')}</strong>
                    <span>${getT('stat_msp_transparency_desc', 'Direct MSP assurance & zero middlemen')}</span>
                  </div>
                </div>
                <div class="sp-quick-stat-item">
                  <div class="sp-stat-icon"><i class="fas fa-indian-rupee-sign"></i></div>
                  <div>
                    <strong>${getT('stat_dbt_transfer', 'Direct Bank Transfer')}</strong>
                    <span>${getT('stat_dbt_transfer_desc', 'Sanctioned J-Forms linked to PFMS/DBT')}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Hero: Role Login & Registration Card -->
            <div class="sp-hero-auth-slot">
              ${renderHeroAuthCard(user, isAuthenticated)}
            </div>

          </div>
        </div>
      </section>

      <!-- ================================================================ -->
      <!-- 2. DIGITAL MANDI IN ACTION: 16:9 VIDEO & 7-STAGE WORKFLOW ENGINE -->
      <!-- ================================================================ -->
      ${renderDigitalMandiVideoSection()}

      <!-- ================================================================ -->
      <!-- 3. WHY SMARTPROCURE? (4 KEY PILLARS)                            -->
      <!-- ================================================================ -->
      <section class="sp-section" id="why-smartprocure" style="background:var(--bg-main);">
        <div class="sp-content-container">
          <div class="sp-section-header">
            <span class="sp-subheading-tag"><i class="fas fa-bullseye"></i> ${getT('sec_core_capabilities', 'CORE CAPABILITIES')}</span>
            <h2 class="sp-section-title">${getT('sec_why_title', 'Why SmartProcure?')}</h2>
            <p class="sp-section-subtitle">
              ${getT('sec_why_sub', 'Engineered specifically for Indian farmers and APMC mandi operations to eliminate bottleneck congestion and ensure complete transparency.')}
            </p>
          </div>

          <div class="sp-why-grid">
            <!-- Card 1 -->
            <div class="sp-why-card">
              <div class="sp-why-icon-box mandi-icon">
                <i class="fas fa-store-alt"></i>
              </div>
              <h3 class="sp-why-title">${getT('pillar_mandi_title', 'Smart Mandi Finder')}</h3>
              <p class="sp-why-text">
                ${getT('pillar_mandi_desc', 'Find the most suitable procurement centre based on price, distance, capacity, weather and expected waiting time.')}
              </p>
              <div class="sp-why-footer">
                <span class="sp-why-link" onclick="handleHeroMandiCta(${isAuthenticated})">
                  ${getT('link_explore_mandis', 'Explore Mandis')} <i class="fas fa-arrow-right"></i>
                </span>
              </div>
            </div>

            <!-- Card 2 -->
            <div class="sp-why-card">
              <div class="sp-why-icon-box slot-icon">
                <i class="fas fa-calendar-check"></i>
              </div>
              <h3 class="sp-why-title">${getT('pillar_slot_title', 'Smart Slot Booking')}</h3>
              <p class="sp-why-text">
                ${getT('pillar_slot_desc', 'Book your preferred procurement date and time slot and receive a digital token.')}
              </p>
              <div class="sp-why-footer">
                <span class="sp-why-link" onclick="handleHeroSlotCta(${isAuthenticated})">
                  ${getT('link_book_slot', 'Book Slot')} <i class="fas fa-arrow-right"></i>
                </span>
              </div>
            </div>

            <!-- Card 3 -->
            <div class="sp-why-card">
              <div class="sp-why-icon-box queue-icon">
                <i class="fas fa-users-line"></i>
              </div>
              <h3 class="sp-why-title">${getT('pillar_queue_title', 'Live Queue Tracking')}</h3>
              <p class="sp-why-text">
                ${getT('pillar_queue_desc', 'Know your token position and estimated waiting time before reaching the centre.')}
              </p>
              <div class="sp-why-footer">
                <span class="sp-why-link" onclick="handleHeroQueueCta(${isAuthenticated})">
                  ${getT('link_track_queue', 'Track Queue')} <i class="fas fa-arrow-right"></i>
                </span>
              </div>
            </div>

            <!-- Card 4 -->
            <div class="sp-why-card">
              <div class="sp-why-icon-box payment-icon">
                <i class="fas fa-hand-holding-dollar"></i>
              </div>
              <h3 class="sp-why-title">${getT('pillar_msp_title', 'Transparent Payment Tracking')}</h3>
              <p class="sp-why-text">
                ${getT('pillar_msp_desc', 'Transparent digital weighment and direct bank payment without middlemen.')}
              </p>
              <div class="sp-why-footer">
                <span class="sp-why-link" onclick="handleHeroPaymentCta(${isAuthenticated})">
                  Check DBT Status <i class="fas fa-arrow-right"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================ -->
      <!-- 3. HOW IT WORKS (10-STEP TIMELINE)                              -->
      <!-- ================================================================ -->
      <section class="sp-section" id="how-it-works" style="background:#FFFFFF; border-top:1px solid #E5E2DC; border-bottom:1px solid #E5E2DC;">
        <div class="sp-content-container">
          <div class="sp-section-header">
            <span class="sp-subheading-tag"><i class="fas fa-route"></i> STEP-BY-STEP PROCESS</span>
            <h2 class="sp-section-title">How It Works</h2>
            <p class="sp-section-subtitle">
              A transparent, 10-stage automated workflow taking farmers from initial slot reservation to final DBT bank credit.
            </p>
          </div>

          <div class="sp-timeline-grid">
            
            <div class="sp-timeline-card">
              <div class="sp-timeline-num">01</div>
              <div class="sp-timeline-icon"><i class="fas fa-user-check"></i></div>
              <h4 class="sp-timeline-title">Register</h4>
              <p class="sp-timeline-desc">Aadhaar/Mobile registration with village and land parcel mapping.</p>
            </div>

            <div class="sp-timeline-card">
              <div class="sp-timeline-num">02</div>
              <div class="sp-timeline-icon"><i class="fas fa-wheat-awn"></i></div>
              <h4 class="sp-timeline-title">Enter Crop &amp; Quantity</h4>
              <p class="sp-timeline-desc">Specify crop variety, harvest moisture estimate, and quintal load.</p>
            </div>

            <div class="sp-timeline-card">
              <div class="sp-timeline-num">03</div>
              <div class="sp-timeline-icon"><i class="fas fa-map-location-dot"></i></div>
              <h4 class="sp-timeline-title">Find Best Centre</h4>
              <p class="sp-timeline-desc">Recommendation engine calculates maximum net realized returns.</p>
            </div>

            <div class="sp-timeline-card">
              <div class="sp-timeline-num">04</div>
              <div class="sp-timeline-icon"><i class="fas fa-calendar-alt"></i></div>
              <h4 class="sp-timeline-title">Book Slot</h4>
              <p class="sp-timeline-desc">Select convenient date and 30-minute arrival appointment window.</p>
            </div>

            <div class="sp-timeline-card">
              <div class="sp-timeline-num">05</div>
              <div class="sp-timeline-icon"><i class="fas fa-qrcode"></i></div>
              <h4 class="sp-timeline-title">Receive Digital Token</h4>
              <p class="sp-timeline-desc">SMS &amp; In-app digital gate pass with QR code and vehicle registration.</p>
            </div>

            <div class="sp-timeline-card">
              <div class="sp-timeline-num">06</div>
              <div class="sp-timeline-icon"><i class="fas fa-truck"></i></div>
              <h4 class="sp-timeline-title">Reach Centre</h4>
              <p class="sp-timeline-desc">Dedicated QR scan gate check-in prevents vehicle queue gridlock.</p>
            </div>

            <div class="sp-timeline-card">
              <div class="sp-timeline-num">07</div>
              <div class="sp-timeline-icon"><i class="fas fa-scale-balanced"></i></div>
              <h4 class="sp-timeline-title">Quality &amp; Weighment</h4>
              <p class="sp-timeline-desc">Assay lab grading and certified electronic weighbridge capture.</p>
            </div>

            <div class="sp-timeline-card">
              <div class="sp-timeline-num">08</div>
              <div class="sp-timeline-icon"><i class="fas fa-file-invoice"></i></div>
              <h4 class="sp-timeline-title">J-Form Generated</h4>
              <p class="sp-timeline-desc">Digitally signed official APMC purchase receipt issued instantly.</p>
            </div>

            <div class="sp-timeline-card">
              <div class="sp-timeline-num">09</div>
              <div class="sp-timeline-icon"><i class="fas fa-stamp"></i></div>
              <h4 class="sp-timeline-title">Payment Processed</h4>
              <p class="sp-timeline-desc">Automated Treasury/Nodal Agency approval without manual delays.</p>
            </div>

            <div class="sp-timeline-card">
              <div class="sp-timeline-num">10</div>
              <div class="sp-timeline-icon"><i class="fas fa-building-columns"></i></div>
              <h4 class="sp-timeline-title">DBT Payment Received</h4>
              <p class="sp-timeline-desc">Direct MSP credit to farmer's Aadhaar-seeded bank account.</p>
            </div>

          </div>
        </div>
      </section>

      <!-- ================================================================ -->
      <!-- 4. SMART MANDI RECOMMENDATION OVERVIEW                           -->
      <!-- ================================================================ -->
      <section class="sp-section" id="smart-mandi" style="background:var(--bg-main);">
        <div class="sp-content-container">
          <div class="sp-section-header">
            <span class="sp-subheading-tag"><i class="fas fa-brain"></i> MULTI-FACTOR OPTIMIZATION</span>
            <h2 class="sp-section-title">Find the Right Procurement Centre</h2>
            <p class="sp-section-subtitle">
              Our smart recommendation engine helps farmers select a suitable procurement centre using real-time operational and market information.
            </p>
          </div>

          <!-- 8 Dynamic Recommendation Factors -->
          <div class="sp-factors-grid">
            <div class="sp-factor-card">
              <div class="sp-factor-icon"><i class="fas fa-tag"></i></div>
              <div class="sp-factor-info">
                <strong>Price &amp; MSP</strong>
                <span>Real-time Agmarknet &amp; state procurement rates</span>
              </div>
            </div>

            <div class="sp-factor-card">
              <div class="sp-factor-icon"><i class="fas fa-road"></i></div>
              <div class="sp-factor-info">
                <strong>Distance</strong>
                <span>Accurate road distance calculations from farm</span>
              </div>
            </div>

            <div class="sp-factor-card">
              <div class="sp-factor-icon"><i class="fas fa-hourglass-half"></i></div>
              <div class="sp-factor-info">
                <strong>Travel Time</strong>
                <span>Tractor/truck travel transit estimations</span>
              </div>
            </div>

            <div class="sp-factor-card">
              <div class="sp-factor-icon"><i class="fas fa-users-viewfinder"></i></div>
              <div class="sp-factor-info">
                <strong>Current Queue</strong>
                <span>Live weighbridge queue &amp; active tokens</span>
              </div>
            </div>

            <div class="sp-factor-card">
              <div class="sp-factor-icon"><i class="fas fa-warehouse"></i></div>
              <div class="sp-factor-info">
                <strong>Procurement Capacity</strong>
                <span>Daily intake quota &amp; godown storage space</span>
              </div>
            </div>

            <div class="sp-factor-card">
              <div class="sp-factor-icon"><i class="fas fa-cloud-sun-rain"></i></div>
              <div class="sp-factor-info">
                <strong>Weather Forecast</strong>
                <span>Open-Meteo precipitation &amp; spoilage risk</span>
              </div>
            </div>

            <div class="sp-factor-card">
              <div class="sp-factor-icon"><i class="fas fa-triangle-exclamation"></i></div>
              <div class="sp-factor-info">
                <strong>Road Conditions</strong>
                <span>Heavy vehicle suitability &amp; rural route status</span>
              </div>
            </div>

            <div class="sp-factor-card sp-factor-highlight">
              <div class="sp-factor-icon" style="background:#10B981; color:#fff;"><i class="fas fa-coins"></i></div>
              <div class="sp-factor-info">
                <strong>Expected Net Return</strong>
                <span>Gross MSP payout minus fuel, toll &amp; transit costs</span>
              </div>
            </div>
          </div>

          <div style="text-align:center; margin-top:32px;">
            <button class="btn btn-primary btn-lg" onclick="handleHeroMandiCta(${isAuthenticated})">
              <i class="fas fa-compass"></i> Find Best Mandi for My Harvest
            </button>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:8px;">
              <i class="fas fa-lock"></i> Authentication required for customized mandi recommendations.
            </p>
          </div>
        </div>
      </section>

      <!-- ================================================================ -->
      <!-- 5. COMPLETE PROCUREMENT JOURNEY TIMELINE                         -->
      <!-- ================================================================ -->
      <section class="sp-section" id="procurement-journey" style="background:#FFFFFF; border-top:1px solid #E5E2DC;">
        <div class="sp-content-container">
          <div class="sp-section-header">
            <span class="sp-subheading-tag"><i class="fas fa-diagram-project"></i> LIFECYCLE ASSURANCE</span>
            <h2 class="sp-section-title">${getT('sec_journey_title', 'Your Complete Procurement Journey')}</h2>
            <p class="sp-section-subtitle">
              ${getT('sec_journey_sub', 'From arrival at the APMC gate to the final DBT credit into your bank account, every phase is verified on the digital ledger.')}
            </p>
          </div>

          <div class="sp-journey-flow">
            <div class="sp-journey-step">
              <div class="sp-journey-badge"><i class="fas fa-id-card"></i></div>
              <span class="sp-journey-label">Registration</span>
            </div>
            <div class="sp-journey-arrow"><i class="fas fa-chevron-right"></i></div>

            <div class="sp-journey-step">
              <div class="sp-journey-badge"><i class="fas fa-calendar-check"></i></div>
              <span class="sp-journey-label">Slot Booking</span>
            </div>
            <div class="sp-journey-arrow"><i class="fas fa-chevron-right"></i></div>

            <div class="sp-journey-step">
              <div class="sp-journey-badge"><i class="fas fa-ticket-simple"></i></div>
              <span class="sp-journey-label">Digital Token</span>
            </div>
            <div class="sp-journey-arrow"><i class="fas fa-chevron-right"></i></div>

            <div class="sp-journey-step">
              <div class="sp-journey-badge"><i class="fas fa-truck-ramp-box"></i></div>
              <span class="sp-journey-label">Arrival</span>
            </div>
            <div class="sp-journey-arrow"><i class="fas fa-chevron-right"></i></div>

            <div class="sp-journey-step">
              <div class="sp-journey-badge"><i class="fas fa-users-rays"></i></div>
              <span class="sp-journey-label">Live Queue</span>
            </div>
            <div class="sp-journey-arrow"><i class="fas fa-chevron-right"></i></div>

            <div class="sp-journey-step">
              <div class="sp-journey-badge"><i class="fas fa-vial-circle-check"></i></div>
              <span class="sp-journey-label">Quality Check</span>
            </div>
            <div class="sp-journey-arrow"><i class="fas fa-chevron-right"></i></div>

            <div class="sp-journey-step">
              <div class="sp-journey-badge"><i class="fas fa-weight-scale"></i></div>
              <span class="sp-journey-label">Weighment</span>
            </div>
            <div class="sp-journey-arrow"><i class="fas fa-chevron-right"></i></div>

            <div class="sp-journey-step">
              <div class="sp-journey-badge"><i class="fas fa-receipt"></i></div>
              <span class="sp-journey-label">J-Form</span>
            </div>
            <div class="sp-journey-arrow"><i class="fas fa-chevron-right"></i></div>

            <div class="sp-journey-step">
              <div class="sp-journey-badge"><i class="fas fa-file-circle-check"></i></div>
              <span class="sp-journey-label">Payment Sanction</span>
            </div>
            <div class="sp-journey-arrow"><i class="fas fa-chevron-right"></i></div>

            <div class="sp-journey-step sp-journey-final">
              <div class="sp-journey-badge" style="background:#10B981; color:#fff;"><i class="fas fa-money-check-dollar"></i></div>
              <span class="sp-journey-label" style="color:#0D5C3A; font-weight:800;">DBT Payment</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================ -->
      <!-- 6. IMPACT & BENEFITS SECTION                                    -->
      <!-- ================================================================ -->
      <section class="sp-section" id="impact" style="background:var(--bg-main); border-top:1px solid #E5E2DC;">
        <div class="sp-content-container">
          <div class="sp-section-header">
            <span class="sp-subheading-tag"><i class="fas fa-chart-line"></i> PURPOSE &amp; OUTCOMES</span>
            <h2 class="sp-section-title">Built to Make Procurement Simpler</h2>
            <p class="sp-section-subtitle">
              Designed under Smart India Hackathon 2026 to resolve operational bottlenecks in agricultural supply chains.
            </p>
          </div>

          <div class="sp-impact-grid">
            
            <div class="sp-impact-card">
              <div class="sp-impact-icon" style="color:#10B981;"><i class="fas fa-stopwatch"></i></div>
              <h4>Less Waiting</h4>
              <p>Eliminate unpredictable overnight waits outside mandis with pre-scheduled arrival slots.</p>
            </div>

            <div class="sp-impact-card">
              <div class="sp-impact-icon" style="color:#2563EB;"><i class="fas fa-traffic-light"></i></div>
              <h4>Reduced Mandi Congestion</h4>
              <p>Dynamic slot pacing and queue throttles prevent traffic blockades and long lines at gates.</p>
            </div>

            <div class="sp-impact-card">
              <div class="sp-impact-icon" style="color:#0D5C3A;"><i class="fas fa-magnifying-glass-location"></i></div>
              <h4>Better Centre Selection</h4>
              <p>Data-driven recommendations factoring net returns, transit time, and centre intake capacity.</p>
            </div>

            <div class="sp-impact-card">
              <div class="sp-impact-icon" style="color:#E06D14;"><i class="fas fa-handshake-angle"></i></div>
              <h4>Transparent Procurement</h4>
              <p>Automated digital weighment capture and immediate J-Form creation with zero tampering.</p>
            </div>

            <div class="sp-impact-card">
              <div class="sp-impact-icon" style="color:#0284C7;"><i class="fas fa-tower-broadcast"></i></div>
              <h4>Real-Time Status</h4>
              <p>Instant SMS, WhatsApp &amp; In-app updates from gate entry to lab approval and payment sanction.</p>
            </div>

            <div class="sp-impact-card">
              <div class="sp-impact-icon" style="color:#16A34A;"><i class="fas fa-vault"></i></div>
              <h4>Faster Payment Visibility</h4>
              <p>Clear tracking of treasury sanction, bank processing, and direct account credit status.</p>
            </div>

            <div class="sp-impact-card">
              <div class="sp-impact-icon" style="color:#8B5CF6;"><i class="fas fa-calendar-check"></i></div>
              <h4>Better Planning</h4>
              <p>Farmers can schedule harvesting and vehicle hire aligned directly with guaranteed mandi intake.</p>
            </div>

            <div class="sp-impact-card">
              <div class="sp-impact-icon" style="color:#D97706;"><i class="fas fa-face-smile"></i></div>
              <h4>Improved Farmer Experience</h4>
              <p>Multilingual, accessible, intuitive interface built for mobile devices and rural connectivity.</p>
            </div>

          </div>
        </div>
      </section>

      <!-- ================================================================ -->
      <!-- 7. GOVERNMENT-STYLE FOOTER                                       -->
      <!-- ================================================================ -->
      <footer class="sp-public-footer">
        <div class="sp-footer-overlay"></div>
        <div class="sp-content-container" style="position:relative; z-index:2;">
          
          <div class="sp-footer-grid">
            
            <!-- Col 1: Brand & Ministry Details -->
            <div class="sp-footer-col brand-col">
              <div class="sp-footer-brand">
                <div class="sp-brand-icon"><i class="fas fa-leaf"></i></div>
                <div>
                  <div class="sp-footer-title">KPMS GOVERNMENT PORTAL</div>
                  <div class="sp-footer-subtitle">Digital India &bull; Smart Agriculture</div>
                </div>
              </div>
              <p class="sp-footer-text">
                National Smart Agricultural Procurement &amp; Queue Automation Platform for modernizing mandi operations across India.
              </p>
              <div class="sp-footer-badges">
                <span class="sp-footer-pill">Digital India</span>
                <span class="sp-footer-pill">e-Procurement</span>
                <span class="sp-footer-pill">Smart Automation</span>
              </div>
            </div>

            <!-- Col 2: Quick Links -->
            <div class="sp-footer-col">
              <h5 class="sp-footer-heading">Quick Links</h5>
              <ul class="sp-footer-links">
                <li><a onclick="window.scrollTo({top: 0, behavior: 'smooth'})"><i class="fas fa-chevron-right"></i> Home</a></li>
                <li><a onclick="if (typeof openAboutModal === 'function') openAboutModal()"><i class="fas fa-chevron-right"></i> About</a></li>
                <li><a onclick="document.getElementById('how-it-works')?.scrollIntoView({behavior: 'smooth'})"><i class="fas fa-chevron-right"></i> How It Works</a></li>
                <li><a onclick="document.getElementById('why-smartprocure')?.scrollIntoView({behavior: 'smooth'})"><i class="fas fa-chevron-right"></i> Features</a></li>
                <li><a onclick="if (typeof openFaqModal === 'function') openFaqModal()"><i class="fas fa-chevron-right"></i> FAQs</a></li>
                <li><a onclick="if (typeof openContactModal === 'function') openContactModal()"><i class="fas fa-chevron-right"></i> Contact</a></li>
              </ul>
            </div>

            <!-- Col 3: Platform Modules -->
            <div class="sp-footer-col">
              <h5 class="sp-footer-heading">Platform</h5>
              <ul class="sp-footer-links">
                <li><a onclick="handleHeroMandiCta(${isAuthenticated})"><i class="fas fa-chevron-right"></i> Smart Mandi Finder</a></li>
                <li><a onclick="handleHeroSlotCta(${isAuthenticated})"><i class="fas fa-chevron-right"></i> Slot Booking</a></li>
                <li><a onclick="handleHeroQueueCta(${isAuthenticated})"><i class="fas fa-chevron-right"></i> Live Queue Tracking</a></li>
                <li><a onclick="handleHeroTrackCta(${isAuthenticated})"><i class="fas fa-chevron-right"></i> Procurement Tracking</a></li>
                <li><a onclick="handleHeroPaymentCta(${isAuthenticated})"><i class="fas fa-chevron-right"></i> DBT Payment Tracking</a></li>
              </ul>
            </div>

            <!-- Col 4: Roles & Portal Access -->
            <div class="sp-footer-col">
              <h5 class="sp-footer-heading">Portals &amp; Roles</h5>
              <ul class="sp-footer-links">
                <li><a onclick="openLandingLoginRole('farmer')"><i class="fas fa-chevron-right"></i> Farmer Portal</a></li>
                <li><a onclick="openLandingLoginRole('officer')"><i class="fas fa-chevron-right"></i> Mandi Officer Portal</a></li>
                <li><a onclick="openLandingLoginRole('admin')"><i class="fas fa-chevron-right"></i> Super Admin Portal</a></li>
                <li><a onclick="if (typeof openRegistrationChooser === 'function') openRegistrationChooser()"><i class="fas fa-chevron-right"></i> New Registration</a></li>
                <li><a onclick="if (typeof openContactModal === 'function') openContactModal()"><i class="fas fa-chevron-right"></i> Grievance Helpdesk</a></li>
              </ul>
            </div>

          </div>

          <!-- Bottom Footer Bar -->
          <div class="sp-footer-bottom">
            <div>
              &copy; 2026 SmartProcure &bull; Kisan Procurement Management System. Built for Smart India Hackathon.
            </div>
            <div class="sp-footer-bottom-links">
              <a onclick="showGenericModal('Privacy Policy', '<p>SmartProcure strictly adheres to Government of India data privacy standards and IT Act norms. Farmer identity details, land records and bank account numbers are stored securely with 256-bit encryption.</p>')">Privacy Policy</a>
              <span>&bull;</span>
              <a onclick="showGenericModal('Terms of Use', '<p>SmartProcure is intended for authorized farmers, APMC officers, and state nodal agencies for verified procurement under government Minimum Support Price (MSP) schemes.</p>')">Terms of Use</a>
              <span>&bull;</span>
              <a onclick="if (typeof openContactModal === 'function') openContactModal()">Help &amp; Support</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  `;

  setTimeout(() => {
    initDigitalMandiVideo();
    if (!isAuthenticated && activeAuthCardTab === 'login' && activeAuthRole === 'admin') {
      if (typeof fetchCaptcha === 'function') setTimeout(fetchCaptcha, 50);
    }
  }, 60);
};

/**
 * ==============================================================================
 * 🎥 DIGITAL MANDI IN ACTION: VIDEO SHOWCASE & WORKFLOW ENGINE
 * ==============================================================================
 */
const WORKFLOW_STAGES = [
  {
    step: 1,
    title: 'Farmer Arrival',
    subtitle: 'Centre & Gate Entry',
    icon: 'fa-tractor',
    badge: 'Stage 01',
    desc: 'Farmer arrives at designated APMC Mandi or procurement center within their pre-allocated 30-minute arrival window. Automated gate identification registers vehicle entry.',
    metric: 'Gate Transit: < 3 mins'
  },
  {
    step: 2,
    title: 'Slot Verification',
    subtitle: 'QR Code Scanning',
    icon: 'fa-qrcode',
    badge: 'Stage 02',
    desc: 'Digital token QR code is verified at entry kiosk. Live records cross-check farmer Aadhaar KYC, crop variety, and land parcel quota in real time.',
    metric: 'Verification: Instant (< 5s)'
  },
  {
    step: 3,
    title: 'Queue',
    subtitle: 'Smart Token Allocation',
    icon: 'fa-users-line',
    badge: 'Stage 03',
    desc: 'Dynamic token routing prioritizes perishable produce and assigns the optimal unloading bay without congestion or manual queue jumping.',
    metric: 'Zero Gridlock Congestion'
  },
  {
    step: 4,
    title: 'Weighing',
    subtitle: 'Digital Weighbridge',
    icon: 'fa-weight-scale',
    badge: 'Stage 04',
    desc: 'Calibrated electronic weighbridge captures vehicle gross weight directly into the central cloud ledger, eliminating manual slip manipulation.',
    metric: 'IoT Digital Capture: 100% Accurate'
  },
  {
    step: 5,
    title: 'Quality Check',
    subtitle: 'Assay & AI Grading',
    icon: 'fa-microscope',
    badge: 'Stage 05',
    desc: 'Automated conveyor assay grading lines inspect produce moisture, foreign matter, and size metrics to determine fair MSP quality grade (Grade A / FAQ).',
    metric: 'Fair Scientific Grading'
  },
  {
    step: 6,
    title: 'Procurement',
    subtitle: 'Digital J-Form Issued',
    icon: 'fa-file-invoice-dollar',
    badge: 'Stage 06',
    desc: 'Tare weight is recorded, net produce weight is determined, and a legally certified digital J-Form receipt is generated with cryptographic seal.',
    metric: 'Instant Digital J-Form Receipt'
  },
  {
    step: 7,
    title: 'Payment',
    subtitle: 'Direct DBT Bank Transfer',
    icon: 'fa-building-columns',
    badge: 'Stage 07',
    desc: 'Procurement sanction is routed via PFMS directly to the farmer\'s Aadhaar-linked bank account without middlemen or commission delays.',
    metric: 'Direct Benefit Transfer in 24-48h'
  }
];

let activeWorkflowStepIndex = 1;

const renderWorkflowDetailCard = (stage) => {
  return `
    <div class="sp-wf-detail-inner">
      <div class="sp-wf-detail-left">
        <span class="sp-wf-badge">${stage.badge}</span>
        <h4 class="sp-wf-detail-title">
          <i class="fas ${stage.icon}"></i> ${stage.title} &mdash; <span style="font-weight:600; color:var(--text-muted); font-size:0.95rem;">${stage.subtitle}</span>
        </h4>
        <p class="sp-wf-detail-desc">${stage.desc}</p>
      </div>
      <div class="sp-wf-detail-right">
        <div class="sp-wf-metric-pill">
          <i class="fas fa-bolt" style="color:#E06D14;"></i>
          <span>${stage.metric}</span>
        </div>
        <button type="button" class="btn btn-sm btn-outline" onclick="seekToWorkflowStage(${stage.step})" style="border-radius:8px; font-weight:700; font-size:0.78rem; padding:6px 12px; display:inline-flex; align-items:center; gap:6px;">
          <i class="fas fa-play"></i> Watch Stage
        </button>
      </div>
    </div>
  `;
};

const renderDigitalMandiVideoSection = () => {
  return `
    <section class="sp-digital-mandi-section" id="digital-mandi-section">
      <!-- Ambient Glow Orbs behind the Glassmorphism card -->
      <div class="sp-mandi-glow-bg glow-1"></div>
      <div class="sp-mandi-glow-bg glow-2"></div>

      <div class="sp-content-container">
        
        <!-- Section Header -->
        <div class="sp-section-header text-center" style="margin-bottom: 28px;">
          <span class="sp-subheading-tag" style="background: rgba(13, 92, 58, 0.08); color: #0D5C3A; border: 1.5px solid rgba(13, 92, 58, 0.22); padding: 5px 14px; border-radius: 9999px; font-weight: 800; letter-spacing: 0.6px; display: inline-flex; align-items: center; gap: 8px;">
            <i class="fas fa-play-circle" style="color:#E06D14;"></i> DIGITAL MANDI IN ACTION
          </span>
          <h2 class="sp-section-title" style="font-size: 2.35rem; margin-top: 12px; margin-bottom: 10px; font-weight: 800; color: var(--primary-dark, #0D5C3A);">
            From Mandi Queue to Digital Procurement
          </h2>
          <p class="sp-section-subtitle" style="font-size: 1.05rem; max-width: 680px; margin: 0 auto; color: var(--text-muted, #4B5563); line-height: 1.6;">
            Making agricultural procurement faster, transparent and farmer-friendly.
          </p>
        </div>

        <!-- Glassmorphism Container with Rounded Corners & Subtle Animation -->
        <div class="sp-mandi-glass-container" id="sp-mandi-player-card">
          
          <!-- 16:9 Responsive Video Player Wrapper -->
          <div class="sp-mandi-player-wrapper" id="sp-mandi-player-wrapper">
            <video 
              id="sp-digital-mandi-video"
              class="sp-mandi-video-element"
              poster="/images/digital_mandi_poster.jpg"
              preload="auto"
              playsinline
              webkit-playsinline
              loop
              muted
            >
              <source src="/videos/mandi_grading_operations.webm" type="video/webm" />
              <source src="/videos/mandi_grading_operations.webm" type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>

            <!-- Krishi Mandi Pill Tag at bottom-left (Matching Live Mandi Grading from screenshot) -->
            <div class="sp-video-tag-pill" id="sp-video-tag-pill">
              <span class="sp-video-pulse-dot"></span>
              <span>Krishi Mandi &bull; Quality Grading &amp; Operations</span>
            </div>

            <!-- Big Center Play / Pause Floating Button Overlay -->
            <button 
              type="button"
              class="sp-video-center-play-btn" 
              id="sp-video-center-play" 
              onclick="toggleMandiVideoPlayback(event)" 
              aria-label="Play or Pause Video"
            >
              <i class="fas fa-play" id="sp-center-play-icon"></i>
            </button>

            <!-- Bottom Custom Video Controls Bar -->
            <div class="sp-mandi-controls-bar" id="sp-mandi-controls">
              <!-- Play / Pause Button -->
              <button type="button" class="sp-control-btn" id="sp-ctrl-play-btn" onclick="toggleMandiVideoPlayback(event)" title="Play / Pause">
                <i class="fas fa-play" id="sp-ctrl-play-icon"></i>
              </button>

              <!-- Current Time / Duration -->
              <div class="sp-control-time" id="sp-ctrl-time">0:00 / 0:00</div>

              <!-- Interactive Progress Scrubber -->
              <div class="sp-progress-container" id="sp-video-progress-track" onclick="seekMandiVideo(event)">
                <div class="sp-progress-bar-filled" id="sp-video-progress-fill"></div>
              </div>

              <!-- Audio Mute / Unmute Button -->
              <button type="button" class="sp-control-btn" id="sp-ctrl-mute-btn" onclick="toggleMandiVideoAudio(event)" title="Mute / Unmute">
                <i class="fas fa-volume-mute" id="sp-ctrl-mute-icon"></i>
              </button>

              <!-- Fullscreen Toggle Button -->
              <button type="button" class="sp-control-btn" id="sp-ctrl-fs-btn" onclick="toggleMandiFullscreen(event)" title="Toggle Fullscreen">
                <i class="fas fa-expand" id="sp-ctrl-fs-icon"></i>
              </button>
            </div>
          </div>

          <!-- 7-Stage Visual Lifecycle Representation:
               Farmer Arrival → Slot Verification → Queue → Weighing → Quality Check → Procurement → Payment -->
          <div class="sp-mandi-workflow-wrapper">
            <div class="sp-workflow-header-row">
              <div class="sp-workflow-title">
                <i class="fas fa-diagram-project" style="color: #0D5C3A;"></i>
                <span>Digital Procurement Lifecycle</span>
              </div>
              <div class="sp-workflow-hint">
                <i class="fas fa-circle-info"></i> Click any stage to navigate in video &amp; view protocol
              </div>
            </div>

            <div class="sp-mandi-workflow-steps" id="sp-workflow-stepper">
              ${WORKFLOW_STAGES.map((st, idx) => `
                <div class="sp-wf-step ${idx === 0 ? 'active' : ''}" data-step="${st.step}" onclick="highlightWorkflowStep(${st.step}, true)">
                  <div class="sp-wf-step-node">
                    <span class="sp-wf-step-num">${st.step}</span>
                    <i class="fas ${st.icon}"></i>
                  </div>
                  <div class="sp-wf-step-content">
                    <strong>${st.title}</strong>
                    <span>${st.subtitle}</span>
                  </div>
                </div>
                ${idx < WORKFLOW_STAGES.length - 1 ? `<div class="sp-wf-arrow"><i class="fas fa-chevron-right"></i></div>` : ''}
              `).join('')}
            </div>

            <!-- Stage Detail Info Card -->
            <div class="sp-wf-detail-card" id="sp-wf-detail-display">
              ${renderWorkflowDetailCard(WORKFLOW_STAGES[0])}
            </div>
          </div>

        </div>

      </div>
    </section>
  `;
};
window.renderDigitalMandiVideoSection = renderDigitalMandiVideoSection;

/**
 * Digital Mandi Video Interaction Handlers
 */
const initDigitalMandiVideo = () => {
  const vid = document.getElementById('sp-digital-mandi-video');
  const playBtn = document.getElementById('sp-video-center-play');
  const playIcon = document.getElementById('sp-center-play-icon');
  const ctrlPlayIcon = document.getElementById('sp-ctrl-play-icon');
  const ctrlMuteIcon = document.getElementById('sp-ctrl-mute-icon');
  const progressBar = document.getElementById('sp-video-progress-fill');
  const timeDisplay = document.getElementById('sp-ctrl-time');

  if (!vid) return;

  const updatePlayIcons = (isPlaying) => {
    if (playIcon) playIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    if (ctrlPlayIcon) ctrlPlayIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    if (playBtn) {
      if (isPlaying) {
        playBtn.classList.add('playing');
      } else {
        playBtn.classList.remove('playing');
      }
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  vid.addEventListener('timeupdate', () => {
    if (vid.duration) {
      const pct = (vid.currentTime / vid.duration) * 100;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (timeDisplay) timeDisplay.textContent = `${formatTime(vid.currentTime)} / ${formatTime(vid.duration)}`;

      // Highlight corresponding stage automatically during playback
      const stageIdx = Math.min(WORKFLOW_STAGES.length - 1, Math.floor((vid.currentTime / vid.duration) * WORKFLOW_STAGES.length));
      const targetStep = WORKFLOW_STAGES[stageIdx].step;
      if (targetStep !== activeWorkflowStepIndex) {
        highlightWorkflowStep(targetStep, false);
      }
    }
  });

  vid.addEventListener('play', () => updatePlayIcons(true));
  vid.addEventListener('pause', () => updatePlayIcons(false));
  vid.addEventListener('ended', () => {
    updatePlayIcons(false);
    vid.currentTime = 0;
  });

  vid.addEventListener('loadedmetadata', () => {
    if (timeDisplay && vid.duration) {
      timeDisplay.textContent = `0:00 / ${formatTime(vid.duration)}`;
    }
  });

  // Autoplay safely on scroll/view
  vid.muted = true;
  const p = vid.play();
  if (p !== undefined) {
    p.catch(() => {
      vid.muted = true;
      vid.play().catch(() => {});
    });
  }
};

window.toggleMandiVideoPlayback = (event) => {
  if (event) event.stopPropagation();
  const vid = document.getElementById('sp-digital-mandi-video');
  if (!vid) return;
  if (vid.paused) {
    vid.play().catch(() => {});
  } else {
    vid.pause();
  }
};

window.toggleMandiVideoAudio = (event) => {
  if (event) event.stopPropagation();
  const vid = document.getElementById('sp-digital-mandi-video');
  const muteIcon = document.getElementById('sp-ctrl-mute-icon');
  if (!vid) return;
  vid.muted = !vid.muted;
  if (muteIcon) {
    muteIcon.className = vid.muted ? 'fas fa-volume-mute' : 'fas fa-volume-high';
  }
};

window.toggleMandiFullscreen = (event) => {
  if (event) event.stopPropagation();
  const wrapper = document.getElementById('sp-mandi-player-wrapper');
  const fsIcon = document.getElementById('sp-ctrl-fs-icon');
  if (!wrapper) return;

  const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

  if (!isFullscreen) {
    if (wrapper.requestFullscreen) {
      wrapper.requestFullscreen();
    } else if (wrapper.webkitRequestFullscreen) {
      wrapper.webkitRequestFullscreen();
    } else if (wrapper.mozRequestFullScreen) {
      wrapper.mozRequestFullScreen();
    } else if (wrapper.msRequestFullscreen) {
      wrapper.msRequestFullscreen();
    }
    if (fsIcon) fsIcon.className = 'fas fa-compress';
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    if (fsIcon) fsIcon.className = 'fas fa-expand';
  }
};

document.addEventListener('fullscreenchange', () => {
  const fsIcon = document.getElementById('sp-ctrl-fs-icon');
  if (fsIcon) {
    fsIcon.className = document.fullscreenElement ? 'fas fa-compress' : 'fas fa-expand';
  }
});

window.seekMandiVideo = (event) => {
  const track = document.getElementById('sp-video-progress-track');
  const vid = document.getElementById('sp-digital-mandi-video');
  if (!track || !vid || !vid.duration) return;
  const rect = track.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const pct = Math.max(0, Math.min(1, clickX / rect.width));
  vid.currentTime = pct * vid.duration;
};

window.highlightWorkflowStep = (stepNumber, seekVideo = false) => {
  activeWorkflowStepIndex = stepNumber;
  const stage = WORKFLOW_STAGES.find(s => s.step === stepNumber) || WORKFLOW_STAGES[0];

  const steps = document.querySelectorAll('.sp-wf-step');
  steps.forEach(st => {
    const num = parseInt(st.getAttribute('data-step'), 10);
    if (num === stepNumber) {
      st.classList.add('active');
    } else {
      st.classList.remove('active');
    }
  });

  const detailSlot = document.getElementById('sp-wf-detail-display');
  if (detailSlot) {
    detailSlot.innerHTML = renderWorkflowDetailCard(stage);
  }

  if (seekVideo) {
    const vid = document.getElementById('sp-digital-mandi-video');
    if (vid && vid.duration) {
      const targetTime = ((stage.step - 1) / WORKFLOW_STAGES.length) * vid.duration;
      vid.currentTime = targetTime;
      if (vid.paused) {
        vid.play().catch(() => {});
      }
    }
  }
};

window.seekToWorkflowStage = (stepNumber) => {
  highlightWorkflowStep(stepNumber, true);
};

/**
 * Render Authentication Card in Hero
 */
const renderHeroAuthCard = (user, isAuthenticated) => {
  return `
    <div class="sp-hero-auth-card" id="sp-hero-auth-card">
      ${isAuthenticated ? renderAuthenticatedHeroCard(user) : renderUnauthenticatedHeroCard()}
    </div>
  `;
};
window.renderHeroAuthCard = renderHeroAuthCard;

/**
 * Render Authentication Card when user is ALREADY authenticated
 */
const renderAuthenticatedHeroCard = (user) => {
  const roleName = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Farmer';
  const roleBadgeClass = user.role === 'admin' ? 'badge-admin' : (user.role === 'officer' ? 'badge-officer' : 'badge-farmer');
  const targetRoute = user.role === 'admin' ? '#admin-dashboard' : (user.role === 'officer' ? '#officer-dashboard' : '#farmer-dashboard');

  return `
    <div class="sp-auth-card-inner auth-logged-in">
      <div class="sp-auth-badge-top">
        <i class="fas fa-circle-check" style="color:#10B981;"></i> ${getT('active_session_badge', 'Active Session')}
      </div>

      <div class="sp-auth-header" style="text-align:center; margin-bottom:16px;">
        <div class="sp-user-avatar-lg">
          ${(user.name || 'U').charAt(0).toUpperCase()}
        </div>
        <h3 class="sp-auth-title" style="margin-top:10px; margin-bottom:4px;">
          ${getT('welcome_back_user', 'Welcome back,')} ${user.name || getT('role_farmer', 'Farmer')}!
        </h3>
        <span class="sp-role-pill ${roleBadgeClass}">
          ${roleName}
        </span>
      </div>

      <p style="font-size:0.85rem; color:var(--text-muted); text-align:center; line-height:1.5; margin-bottom:20px;">
        You are authenticated with full access to your personalized portal, bookings, and live queue updates.
      </p>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <button class="btn btn-primary btn-lg" style="width:100%; justify-content:center;" onclick="routeTo('${targetRoute}')">
          <i class="fas fa-gauge-high"></i> Go to ${roleName} Dashboard
        </button>
        <button class="btn btn-outline" style="width:100%; justify-content:center; color:#EF4444;" onclick="logout()">
          <i class="fas fa-sign-out-alt"></i> ${getT('sign_out', 'Sign Out')}
        </button>
      </div>

      <div class="sp-auth-security-notice" style="margin-top:18px; text-align:center;">
        <small><i class="fas fa-shield-alt"></i> Secured session with inactivity auto-logout protection</small>
      </div>
    </div>
  `;
};

/**
 * Render Authentication Card when user is NOT authenticated
 */
const renderUnauthenticatedHeroCard = () => {
  return `
    <div class="sp-auth-card-inner">
      <div class="sp-auth-card-header">
        <h3 class="sp-auth-title">${getT('auth_welcome_title', 'Welcome to SmartProcure')}</h3>
        <p class="sp-auth-subtitle">${getT('auth_welcome_sub', 'Your trusted partner in agricultural procurement')}</p>
      </div>

      <!-- Two Tabs: LOGIN and REGISTER -->
      <div class="sp-auth-tabs">
        <button 
          class="sp-auth-tab ${activeAuthCardTab === 'login' ? 'active' : ''}" 
          id="tab-btn-login"
          onclick="switchHeroAuthTab('login')"
        >
          <i class="fas fa-right-to-bracket"></i> ${getT('tab_login', 'LOGIN')}
        </button>
        <button 
          class="sp-auth-tab ${activeAuthCardTab === 'register' ? 'active' : ''}" 
          id="tab-btn-register"
          onclick="switchHeroAuthTab('register')"
        >
          <i class="fas fa-user-plus"></i> ${getT('tab_register', 'REGISTER')}
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="sp-hero-auth-content">
        ${activeAuthCardTab === 'login' ? renderHeroLoginForm() : renderHeroRegisterForm()}
      </div>
    </div>
  `;
};

/**
 * Render Embedded Login Form inside Hero Auth Card
 */
const renderHeroLoginForm = () => {
  const roleConfigs = {
    farmer: {
      label: getT('field_farmer_id', 'Mobile Number / Farmer ID'),
      placeholder: getT('placeholder_farmer_id', 'e.g. 9876543210 or FRM202600001'),
      defaultVal: '',
      passVal: '',
      btnText: getT('login_role_farmer_btn', 'Login to Kisan Portal'),
      btnColor: '#0D5C3A',
      photo: '/images/roles/farmer.jpg'
    },
    officer: {
      label: getT('field_officer_id', 'Official Email / Employee ID'),
      placeholder: getT('placeholder_officer_id', 'e.g. officer@kpms.gov.in'),
      defaultVal: '',
      passVal: '',
      btnText: getT('login_role_officer_btn', 'Login to Officer Portal'),
      btnColor: '#2563EB',
      photo: '/images/roles/officer.jpg'
    },
    admin: {
      label: getT('field_admin_email', 'Super Admin Email'),
      placeholder: getT('placeholder_admin_id', 'e.g. admin@kpms.gov.in'),
      defaultVal: '',
      passVal: '',
      btnText: getT('login_role_admin_btn', 'Login as Administrator'),
      btnColor: '#E06D14',
      photo: '/images/roles/admin.jpg'
    }
  };

  const cfg = roleConfigs[activeAuthRole] || roleConfigs.farmer;

  return `
    <form id="hero-login-form" onsubmit="handleHeroLoginSubmit(event)" novalidate>
      
      <!-- Role Selector Pills -->
      <div class="sp-auth-role-pills">
        <button 
          type="button" 
          class="sp-auth-role-pill ${activeAuthRole === 'farmer' ? 'active' : ''}" 
          onclick="switchHeroAuthRole('farmer')"
        >
          <img src="/images/roles/farmer.jpg" alt="Farmer" style="width:18px; height:18px; border-radius:50%; object-fit:cover; margin-right:5px; vertical-align:middle; border:1px solid rgba(255,255,255,0.4);" /> ${getT('role_farmer', 'Farmer')}
        </button>
        <button 
          type="button" 
          class="sp-auth-role-pill ${activeAuthRole === 'officer' ? 'active' : ''}" 
          onclick="switchHeroAuthRole('officer')"
        >
          <img src="/images/roles/officer.jpg" alt="Officer" style="width:18px; height:18px; border-radius:50%; object-fit:cover; margin-right:5px; vertical-align:middle; border:1px solid rgba(255,255,255,0.4);" /> ${getT('role_officer', 'Officer')}
        </button>
        <button 
          type="button" 
          class="sp-auth-role-pill ${activeAuthRole === 'admin' ? 'active' : ''}" 
          onclick="switchHeroAuthRole('admin')"
        >
          <img src="/images/roles/admin.jpg" alt="Super Admin" style="width:18px; height:18px; border-radius:50%; object-fit:cover; margin-right:5px; vertical-align:middle; border:1px solid rgba(255,255,255,0.4);" /> ${getT('role_admin', 'Super Admin')}
        </button>
      </div>

      <!-- Identifier Field -->
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-size:0.8rem; font-weight:700; color:var(--text-main); margin-bottom:4px; display:block;">
          <i class="fas fa-user" style="color:var(--primary-dark);"></i> ${cfg.label} <span style="color:#EF4444;">*</span>
        </label>
        <div class="form-input-wrapper">
          <input 
            type="text" 
            id="hero-auth-id" 
            name="identifier" 
            class="form-control" 
            style="font-size:0.88rem; padding:10px 12px;"
            placeholder="${cfg.placeholder}" 
            value="${cfg.defaultVal}"
            required 
            autocomplete="username" 
          />
        </div>
      </div>

      <!-- Password Field -->
      <div class="form-group" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <label class="form-label" style="font-size:0.8rem; font-weight:700; color:var(--text-main); margin-bottom:0;">
            <i class="fas fa-key" style="color:var(--primary-dark);"></i> ${getT('login_password', 'Password')} <span style="color:#EF4444;">*</span>
          </label>
          <a onclick="if (typeof openForgotPasswordModal === 'function') openForgotPasswordModal('${activeAuthRole}')" style="font-size:0.75rem; color:var(--saffron); cursor:pointer; font-weight:600;">
            ${getT('form_forgot_pass', 'Forgot Password?')}
          </a>
        </div>
        <div class="form-input-wrapper" style="position:relative;">
          <input 
            type="password" 
            id="hero-auth-pass" 
            name="password" 
            class="form-control" 
            style="font-size:0.88rem; padding:10px 38px 10px 12px;"
            placeholder="${getT('placeholder_password', 'Enter secure password')}" 
            value="${cfg.passVal}"
            required 
            autocomplete="current-password" 
          />
          <span 
            onclick="toggleHeroPassword('hero-auth-pass', this)" 
            style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; color:var(--text-muted); font-size:0.85rem;"
          >
            <i class="fas fa-eye"></i>
          </span>
        </div>
      </div>

      <!-- Super Admin CAPTCHA Section -->
      ${activeAuthRole === 'admin' ? `
        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label" style="font-size:0.8rem; font-weight:700; color:var(--text-main); margin-bottom:4px; display:block;">
            <i class="fas fa-shield-alt" style="color:var(--primary-dark);"></i> ${getT('captcha_label', 'Security Verification (CAPTCHA)')} <span style="color:#EF4444;">*</span>
          </label>
          <div class="captcha-container" style="display:flex; align-items:center; gap:8px; margin-bottom:8px; background:rgba(0,0,0,0.04); border:1px dashed #CBD5E1; padding:8px 12px; border-radius:8px;">
            <div id="hero-captcha-question-slot" class="captcha-display" style="flex:1; font-family:monospace; font-size:1.25rem; font-weight:800; letter-spacing:3px; text-align:center; color:var(--saffron); user-select:none;">Loading...</div>
            <button type="button" class="captcha-refresh-btn" onclick="fetchCaptcha()" title="Refresh CAPTCHA">
              <i class="fas fa-rotate"></i>
            </button>
          </div>
          <div class="form-input-wrapper">
            <input 
              type="text" 
              id="hero-auth-captcha" 
              name="captcha" 
              class="form-control" 
              style="font-size:0.88rem; padding:10px 12px;"
              placeholder="${getT('placeholder_captcha', 'Enter calculation solution or code')}" 
              required 
              autocomplete="off" 
            />
          </div>
        </div>
      ` : ''}

      <!-- Remember Me Checkbox -->
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px;">
        <input type="checkbox" id="hero-auth-remember" name="rememberMe" style="width:15px; height:15px; accent-color:var(--saffron); cursor:pointer;" checked />
        <label for="hero-auth-remember" style="font-size:0.78rem; color:var(--text-muted); cursor:pointer; user-select:none;">
          ${getT('form_remember', 'Remember this device')}
        </label>
      </div>

      <!-- Submit Login Button -->
      <button 
        type="submit" 
        id="hero-auth-submit-btn" 
        class="btn btn-primary" 
        style="width:100%; justify-content:center; padding:11px; font-weight:700; font-size:0.9rem; background:${cfg.btnColor}; border-color:${cfg.btnColor}; display:flex; align-items:center; gap:8px;"
      >
        <img src="${cfg.photo}" alt="${activeAuthRole}" style="width:20px; height:20px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.6);" />
        <span>${cfg.btnText}</span>
        <i class="fas fa-arrow-right" style="margin-left:4px;"></i>
      </button>

      <!-- Alternative Auth (Aadhaar Coming Soon - No Fake Integration) -->
      <div style="margin-top:12px; text-align:center;">
        <button 
          type="button" 
          class="btn btn-outline" 
          style="width:100%; justify-content:center; font-size:0.8rem; padding:8px; border-color:#D1D5DB; color:#6B7280; cursor:default;" 
          title="UIDAI Aadhaar OTP verification is under compliance integration"
        >
          <i class="fas fa-fingerprint" style="color:#0D5C3A;"></i> ${getT('auth_login_aadhaar', 'Login with Aadhaar')} <span class="badge" style="background:#E5E7EB; color:#4B5563; font-size:0.68rem; margin-left:6px;">${getT('status_coming_soon', 'Coming Soon')}</span>
        </button>
      </div>

      <!-- Switch to Register -->
      <div style="text-align:center; margin-top:12px; font-size:0.8rem; color:var(--text-muted);">
        ${getT('auth_no_account', "Don't have an account?")} 
        <a onclick="switchHeroAuthTab('register')" style="color:var(--saffron); font-weight:700; cursor:pointer; text-decoration:underline; margin-left:4px;">
          ${getT('auth_register_now', 'Register Now')}
        </a>
      </div>

    </form>
  `;
};

/**
 * Render Registration Options inside Hero Auth Card
 */
const renderHeroRegisterForm = () => {
  return `
    <div style="padding:4px 0;">
      <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.5; margin-bottom:14px; text-align:center;">
        ${getT('reg_hero_sub', 'Create a verified digital identity on the National Kisan Procurement Grid.')}
      </p>

      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
        
        <!-- Farmer Registration Card -->
        <div 
          class="sp-reg-option-card" 
          onclick="initiateRegistrationFromHero('farmer')"
          style="border:1.5px solid #10B981; background:rgba(16, 185, 129, 0.05); border-radius:10px; padding:12px 14px; cursor:pointer; transition:all 0.2s ease;"
        >
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:42px; height:42px; border-radius:50%; overflow:hidden; border:2px solid #10B981; flex-shrink:0; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(16,185,129,0.25); background:#FFF;">
              <img src="/images/roles/farmer.jpg" alt="Farmer" style="width:100%; height:100%; object-fit:cover; display:block;" />
            </div>
            <div style="flex:1;">
              <strong style="font-size:0.9rem; color:var(--text-main); display:block;">${getT('reg_farmer_card_title', 'Farmer / Kisan Registration')}</strong>
              <small style="font-size:0.75rem; color:var(--text-muted);">${getT('reg_farmer_card_sub', 'Aadhaar e-KYC, land verification, and instant token booking')}</small>
            </div>
            <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#10B981;"></i>
          </div>
        </div>

        <!-- Officer Registration Card -->
        <div 
          class="sp-reg-option-card" 
          onclick="initiateRegistrationFromHero('officer')"
          style="border:1.5px solid #2563EB; background:rgba(37, 99, 235, 0.05); border-radius:10px; padding:12px 14px; cursor:pointer; transition:all 0.2s ease;"
        >
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:42px; height:42px; border-radius:50%; overflow:hidden; border:2px solid #2563EB; flex-shrink:0; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(37,99,235,0.25); background:#FFF;">
              <img src="/images/roles/officer.jpg" alt="Procurement Officer" style="width:100%; height:100%; object-fit:cover; display:block;" />
            </div>
            <div style="flex:1;">
              <strong style="font-size:0.9rem; color:var(--text-main); display:block;">${getT('reg_officer_card_title', 'Procurement Officer Registration')}</strong>
              <small style="font-size:0.75rem; color:var(--text-muted);">${getT('reg_officer_card_sub', 'Official APMC cadre allocation (Requires Admin Approval)')}</small>
            </div>
            <i class="fas fa-chevron-right" style="font-size:0.8rem; color:#2563EB;"></i>
          </div>
        </div>

      </div>

      <!-- Super Admin Note -->
      <div style="background:#FAF6EF; border:1px solid #E5E2DC; border-radius:8px; padding:10px 12px; font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:10px; margin-bottom:12px;">
        <div style="width:26px; height:26px; border-radius:50%; overflow:hidden; border:1.5px solid #E06D14; flex-shrink:0;">
          <img src="/images/roles/admin.jpg" alt="Super Admin" style="width:100%; height:100%; object-fit:cover; display:block;" />
        </div>
        <span>${getT('reg_admin_note', 'Super Admin accounts require ministry provisioning and cannot be registered publicly.')}</span>
      </div>

      <div style="text-align:center; font-size:0.8rem; color:var(--text-muted);">
        ${getT('auth_already_registered', 'Already registered?')} 
        <a onclick="switchHeroAuthTab('login')" style="color:var(--saffron); font-weight:700; cursor:pointer; text-decoration:underline; margin-left:4px;">
          ${getT('auth_back_to_login', 'Back to Login')}
        </a>
      </div>
    </div>
  `;
};

/**
 * Tab and Role Switchers
 */
const switchHeroAuthTab = (tab) => {
  activeAuthCardTab = tab;
  const slot = document.getElementById('sp-hero-auth-card');
  if (slot) slot.innerHTML = renderUnauthenticatedHeroCard();
  if (tab === 'login' && activeAuthRole === 'admin' && typeof fetchCaptcha === 'function') {
    setTimeout(fetchCaptcha, 30);
  }
};

const switchHeroAuthRole = (role) => {
  activeAuthRole = role;
  const content = document.getElementById('sp-hero-auth-content');
  if (content) content.innerHTML = renderHeroLoginForm();
  if (role === 'admin' && typeof fetchCaptcha === 'function') {
    setTimeout(fetchCaptcha, 30);
  }
};

const toggleHeroPassword = (inputId, iconEl) => {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  iconEl.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
};

const openLandingLoginRole = (role) => {
  activeAuthRole = role;
  activeAuthCardTab = 'login';
  const heroCard = document.getElementById('sp-hero-auth-card');
  if (heroCard) {
    heroCard.innerHTML = renderUnauthenticatedHeroCard();
    if (typeof heroCard.scrollIntoView === 'function') {
      heroCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const idField = document.getElementById('hero-auth-id');
    if (idField && typeof idField.focus === 'function') {
      idField.focus();
    }
    if (role === 'admin' && typeof fetchCaptcha === 'function') {
      setTimeout(fetchCaptcha, 30);
    }
  } else {
    if (typeof openLoginModal === 'function') {
      openLoginModal(role);
    }
  }
};

window.switchHeroAuthTab = switchHeroAuthTab;
window.switchHeroAuthRole = switchHeroAuthRole;
window.toggleHeroPassword = toggleHeroPassword;
window.openLandingLoginRole = openLandingLoginRole;

/**
 * Handle Hero Login Form Submission
 */
const handleHeroLoginSubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const identifier = form.identifier.value.trim();
  const password = form.password.value;
  const rememberMe = form.rememberMe ? form.rememberMe.checked : true;
  const captchaAnswer = form.captcha ? form.captcha.value.trim() : null;

  if (!identifier || !password) {
    if (typeof showToast === 'function') showToast('Please enter both identifier and password.', 'error');
    return;
  }

  if (activeAuthRole === 'admin' && !captchaAnswer) {
    if (typeof showToast === 'function') showToast('Please enter the CAPTCHA solution.', 'error');
    const capInput = document.getElementById('hero-auth-captcha');
    if (capInput && typeof capInput.focus === 'function') capInput.focus();
    return;
  }

  const roleConfigs = {
    farmer: { photo: '/images/roles/farmer.jpg', btnText: getT('login_role_farmer_btn', 'Login to Kisan Portal') },
    officer: { photo: '/images/roles/officer.jpg', btnText: getT('login_role_officer_btn', 'Login to Officer Portal') },
    admin: { photo: '/images/roles/admin.jpg', btnText: getT('login_role_admin_btn', 'Login as Administrator') }
  };
  const cfg = roleConfigs[activeAuthRole] || roleConfigs.farmer;

  const submitBtn = document.getElementById('hero-auth-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
  }

  try {
    const tokenVal = (typeof getCurrentCaptchaToken === 'function' ? getCurrentCaptchaToken() : '') || window.currentCaptchaToken || '';
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: activeAuthRole,
        identifier,
        password,
        rememberMe,
        captchaToken: tokenVal,
        captchaAnswer
      })
    });

    const data = await res.json();

    if (res.status === 423) {
      if (typeof showToast === 'function') showToast(data.message || 'Account locked.', 'error');
      if (typeof renderLockoutNotice === 'function') renderLockoutNotice(data);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<img src="${cfg.photo}" alt="${activeAuthRole}" style="width:20px; height:20px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.6);" /> <span>${cfg.btnText}</span> <i class="fas fa-arrow-right" style="margin-left:4px;"></i>`;
      }
      return;
    }

    if (res.status === 403 && data.status === 'Pending_Admin_Approval') {
      if (typeof renderPendingOfficerNotice === 'function') renderPendingOfficerNotice(data);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<img src="${cfg.photo}" alt="${activeAuthRole}" style="width:20px; height:20px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.6);" /> <span>${cfg.btnText}</span> <i class="fas fa-arrow-right" style="margin-left:4px;"></i>`;
      }
      return;
    }

    if (!data.success) {
      if (activeAuthRole === 'admin' && typeof fetchCaptcha === 'function') {
        fetchCaptcha();
      }

      // Check if user account belongs to a different role
      if (data.correctRole) {
        if (typeof showToast === 'function') showToast(data.message, 'warning');
        switchHeroAuthRole(data.correctRole);
        const idField = document.getElementById('hero-auth-id');
        if (idField) idField.value = identifier;
        const passField = document.getElementById('hero-auth-pass');
        if (passField) {
          passField.value = password;
          passField.focus();
        }
        return;
      }

      if (typeof showToast === 'function') showToast(data.message || 'Authentication failed. Please verify credentials.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<img src="${cfg.photo}" alt="${activeAuthRole}" style="width:20px; height:20px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.6);" /> <span>${cfg.btnText}</span> <i class="fas fa-arrow-right" style="margin-left:4px;"></i>`;
      }
      return;
    }

    // Two-Factor Authentication required
    if (data.requiresOtp) {
      const sessionObj = {
        tempSessionId: data.tempSessionId,
        maskedTarget: data.maskedTarget,
        role: data.role,
        mobile: data.mobile,
        expiresInSeconds: data.expiresInSeconds || 300,
        resendCooldownSeconds: data.resendCooldownSeconds || 60
      };

      if (typeof window.setLoginSession === 'function') {
        window.setLoginSession(sessionObj);
      } else {
        window.currentLoginSession = sessionObj;
        try {
          sessionStorage.setItem('kpms_login_session', JSON.stringify(sessionObj));
        } catch (e) {}
      }

      if (typeof openLoginOtpScreen === 'function') {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('active');
        openLoginOtpScreen(sessionObj);
      }
      if (typeof showToast === 'function') showToast(data.message, 'info');
    } else if (data.token) {
      if (typeof completeSessionLogin === 'function') {
        completeSessionLogin(data);
      } else {
        localStorage.setItem('kpms_token', data.token);
        localStorage.setItem('kpms_user', JSON.stringify(data.user));
        if (typeof updateNavAuth === 'function') updateNavAuth();
        const target = data.user.role === 'admin' ? '#admin-dashboard' : (data.user.role === 'officer' ? '#officer-dashboard' : '#farmer-dashboard');
        routeTo(target);
      }
    }
  } catch (err) {
    if (activeAuthRole === 'admin' && typeof fetchCaptcha === 'function') {
      fetchCaptcha();
    }
    if (typeof showToast === 'function') showToast('Network error: ' + err.message, 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<img src="${cfg.photo}" alt="${activeAuthRole}" style="width:20px; height:20px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.6);" /> <span>${cfg.btnText}</span> <i class="fas fa-arrow-right" style="margin-left:4px;"></i>`;
    }
  }
};

/**
 * Handle Registration Trigger from Landing Page
 */
const initiateRegistrationFromHero = (role) => {
  const modal = document.getElementById('auth-modal');
  const startFn = window.startRegistrationFlow || (typeof startRegistrationFlow === 'function' ? startRegistrationFlow : null);
  const chooserFn = window.openRegistrationChooser || (typeof openRegistrationChooser === 'function' ? openRegistrationChooser : null);

  if (role && typeof startFn === 'function') {
    if (modal) modal.classList.add('active');
    startFn(role);
  } else if (typeof chooserFn === 'function') {
    if (modal) modal.classList.add('active');
    chooserFn();
  } else {
    if (typeof showToast === 'function') showToast('Registration module is loading, please try again...', 'info');
  }
};

/**
 * Protected CTA Triggers
 */
const handleHeroMandiCta = (isAuthenticated) => {
  if (isAuthenticated) {
    routeTo('#smart-booking');
  } else {
    if (typeof showToast === 'function') showToast('Please login to use Smart Mandi Finder.', 'info');
    openLandingLoginRole('farmer');
  }
};

const handleHeroTrackCta = (isAuthenticated) => {
  if (isAuthenticated) {
    routeTo('#procurement-status');
  } else {
    if (typeof showToast === 'function') showToast('Please login to track your procurement status.', 'info');
    openLandingLoginRole('farmer');
  }
};

const handleHeroSlotCta = (isAuthenticated) => {
  if (isAuthenticated) {
    routeTo('#book-slot');
  } else {
    if (typeof showToast === 'function') showToast('Please login to book a procurement slot.', 'info');
    openLandingLoginRole('farmer');
  }
};

const handleHeroQueueCta = (isAuthenticated) => {
  if (isAuthenticated) {
    routeTo('#farmer-queue');
  } else {
    if (typeof showToast === 'function') showToast('Please login to track live queue status.', 'info');
    openLandingLoginRole('farmer');
  }
};

const handleHeroPaymentCta = (isAuthenticated) => {
  if (isAuthenticated) {
    routeTo('#farmer-payments');
  } else {
    if (typeof showToast === 'function') showToast('Please login to check DBT payment records.', 'info');
    openLandingLoginRole('farmer');
  }
};

// Expose globals
window.renderPublicLandingPage = renderPublicLandingPage;
window.switchHeroAuthTab = switchHeroAuthTab;
window.switchHeroAuthRole = switchHeroAuthRole;
window.toggleHeroPassword = toggleHeroPassword;
window.handleHeroLoginSubmit = handleHeroLoginSubmit;
window.initiateRegistrationFromHero = initiateRegistrationFromHero;
window.handleHeroMandiCta = handleHeroMandiCta;
window.handleHeroTrackCta = handleHeroTrackCta;
window.handleHeroSlotCta = handleHeroSlotCta;
window.handleHeroQueueCta = handleHeroQueueCta;
window.handleHeroPaymentCta = handleHeroPaymentCta;
window.openLandingLoginRole = openLandingLoginRole;
