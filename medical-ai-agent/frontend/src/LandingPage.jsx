import React, { useEffect, useRef } from 'react';
import './LandingPage.css';

const LandingPage = ({ onStart }) => {
  const cursorRef = useRef(null);
  const cursorRingRef = useRef(null);
  const navRef = useRef(null);
  const frameRef = useRef(null);
  const heroRightRef = useRef(null);

  useEffect(() => {
    // Cursor logic
    let mx = 0, my = 0, rx = 0, ry = 0;
    let requestRef;

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mx - 5}px, ${my - 5}px)`;
      }
    };

    const animateRing = () => {
      rx += (mx - rx - 17) * 0.13;
      ry += (my - ry - 17) * 0.13;
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      }
      requestRef = requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', onMouseMove);
    requestRef = requestAnimationFrame(animateRing);

    // Nav scroll logic
    const onScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 36) {
          navRef.current.classList.add('scrolled');
        } else {
          navRef.current.classList.remove('scrolled');
        }
      }
    };
    window.addEventListener('scroll', onScroll);

    // Reveal logic
    const revealElements = document.querySelectorAll('.lp-reveal');
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('lp-visible');
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach(el => ro.observe(el));

    // Frame 3D tilt
    const onFrameMove = (e) => {
      if (!frameRef.current || !heroRightRef.current) return;
      const r = frameRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const rotateX = ((e.clientY - cy) / (r.height / 2)) * 3;
      const rotateY = -((e.clientX - cx) / (r.width / 2)) * 5;
      frameRef.current.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    const onFrameLeave = () => {
      if (frameRef.current) {
        frameRef.current.style.transform = 'perspective(1200px) rotateY(-5deg) rotateX(2deg)';
      }
    };

    const heroRightEl = heroRightRef.current;
    if (heroRightEl) {
      heroRightEl.addEventListener('mousemove', onFrameMove);
      heroRightEl.addEventListener('mouseleave', onFrameLeave);
    }

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(requestRef);
      window.removeEventListener('scroll', onScroll);
      revealElements.forEach(el => ro.unobserve(el));
      ro.disconnect();
      if (heroRightEl) {
        heroRightEl.removeEventListener('mousemove', onFrameMove);
        heroRightEl.removeEventListener('mouseleave', onFrameLeave);
      }
    };
  }, []);

  return (
    <div className="lp-wrapper">
      <div className="lp-cursor" ref={cursorRef}></div>
      <div className="lp-cursor-ring" ref={cursorRingRef}></div>

      {/* NAV */}
      <nav ref={navRef}>
        <a href="#" className="lp-nav-logo">
          <div className="lp-logo-icon">
            <svg viewBox="0 0 20 20" fill="none"><path d="M2 10h4l2-5 3 10 2-6 1.5 3H18" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          Diagnos AI
        </a>
        <ul className="lp-nav-links">
          <li><a href="#modules">Modules</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How It Works</a></li>
        </ul>
        <button onClick={onStart} className="lp-btn-launch">Launch Portal →</button>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-bg"></div>
        <div className="lp-hero-grid"></div>
        <div className="lp-hero-left">
          <div className="lp-badge">
            <span className="lp-badge-dot"></span>
            Free to use · No sign-in required
          </div>
          <h1 className="lp-title">Your AI-Powered<br/><em>Medical Assistant.</em></h1>
          <p className="lp-hero-desc">
            Ask health questions, upload X-rays for AI analysis, or describe your symptoms — get a structured report instantly. Built <strong>privacy-first</strong>, free for everyone.
          </p>
          <div className="lp-hero-actions">
            <button onClick={onStart} className="lp-btn-hero">
              Open Diagnos AI
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 7.5h10M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div className="lp-hero-note">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L8.5 4.5H12L9.5 6.5L10.5 10L7 8L3.5 10L4.5 6.5L2 4.5H5.5L7 1Z" fill="currentColor"/></svg>
              No account needed · Instant access
            </div>
          </div>
        </div>

        <div className="lp-hero-right" ref={heroRightRef}>
          <div style={{ position: 'relative' }}>
            <div className="lp-float-badge lp-fb2">
              <div className="lp-fbi" style={{ background: '#EEF9F4' }}>🧬</div>
              <div><div className="lp-fbv">Vision Analysis Done</div><div className="lp-fbs">X-ray processed in ~3s</div></div>
            </div>
            <div className="lp-float-badge lp-fb1">
              <div className="lp-fbi" style={{ background: '#FFF4EE' }}>🔊</div>
              <div><div className="lp-fbv">Text-to-Speech Active</div><div className="lp-fbs">Reading in Hindi</div></div>
            </div>
            <div className="lp-app-frame" ref={frameRef}>
              <div className="lp-app-topbar">
                <div className="lp-dots"><span></span><span></span><span></span></div>
                <div className="lp-app-tab-bar">
                  <div className="lp-app-tab lp-active">Chat</div>
                  <div className="lp-app-tab">Vision</div>
                  <div className="lp-app-tab">Diagnosis</div>
                </div>
              </div>
              <div className="lp-app-body">
                <div className="lp-chat-messages">
                  <div className="lp-msg lp-user">
                    <div className="lp-msg-av lp-user">U</div>
                    <div className="lp-bubble">What could cause persistent chest tightness with mild shortness of breath?</div>
                  </div>
                  <div className="lp-msg lp-ai">
                    <div className="lp-msg-av lp-ai">AI</div>
                    <div>
                      <div className="lp-bubble">These symptoms <strong>may suggest</strong> several conditions. Common possibilities include:<br/><br/>• <strong>Costochondritis</strong> — rib cartilage inflammation<br/>• <strong>Anxiety / Panic</strong> — very common with chest tightness<br/>• <strong>GERD</strong> — acid reflux causing pressure<br/><br/><span style={{ fontSize: '11px', color: '#888' }}>⚠ Educational only. Consult a doctor.</span></div>
                      <div className="lp-bubble-actions">
                        <button className="lp-bact">🔊 Listen</button>
                        <button className="lp-bact">🌐 Translate</button>
                        <button className="lp-bact">📋 Go Deeper</button>
                      </div>
                    </div>
                  </div>
                  <div className="lp-msg lp-ai">
                    <div className="lp-msg-av lp-ai">AI</div>
                    <div className="lp-bubble" style={{ background: '#F0F4FF', padding: '0' }}>
                      <div className="lp-typing"><span></span><span></span><span></span></div>
                    </div>
                  </div>
                </div>
                <div className="lp-chat-input-row">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#aab', flexShrink: 0 }}><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  <input className="lp-ci" placeholder="Attach an image or ask a question…" readOnly />
                  <button className="lp-cs"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6h10M7 2l4 4-4 4" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="lp-mq">
        <div className="lp-mq-track">
          <div className="lp-mi"><span className="lp-mid"></span>Medical Chat Agent</div>
          <div className="lp-mi"><span className="lp-mid"></span>X-Ray Vision Analysis</div>
          <div className="lp-mi"><span className="lp-mid"></span>Symptom Triage</div>
          <div className="lp-mi"><span className="lp-mid"></span>Text-to-Speech Responses</div>
          <div className="lp-mi"><span className="lp-mid"></span>Hindi & Telugu Translation</div>
          <div className="lp-mi"><span className="lp-mid"></span>Multimodal Image Upload</div>
          <div className="lp-mi"><span className="lp-mid"></span>Emergency Detection</div>
          <div className="lp-mi"><span className="lp-mid"></span>No Sign-In Required</div>
          <div className="lp-mi"><span className="lp-mid"></span>Privacy First</div>
          {/* duplicate for seamless loop */}
          <div className="lp-mi"><span className="lp-mid"></span>Medical Chat Agent</div>
          <div className="lp-mi"><span className="lp-mid"></span>X-Ray Vision Analysis</div>
          <div className="lp-mi"><span className="lp-mid"></span>Symptom Triage</div>
          <div className="lp-mi"><span className="lp-mid"></span>Text-to-Speech Responses</div>
          <div className="lp-mi"><span className="lp-mid"></span>Hindi & Telugu Translation</div>
          <div className="lp-mi"><span className="lp-mid"></span>Multimodal Image Upload</div>
          <div className="lp-mi"><span className="lp-mid"></span>Emergency Detection</div>
          <div className="lp-mi"><span className="lp-mid"></span>No Sign-In Required</div>
          <div className="lp-mi"><span className="lp-mid"></span>Privacy First</div>
        </div>
      </div>

      {/* MODULES */}
      <section className="lp-mod-bg" id="modules">
        <div className="lp-tc">
          <div className="lp-tag">Three Modules</div>
          <h2 className="lp-title" style={{color: 'inherit'}}>Everything You Need.<br/>Nothing You Don't.</h2>
          <p className="lp-sub">Three focused tools that work together — and hand off to each other seamlessly.</p>
        </div>
        <div className="lp-mod-grid">
          <div className="lp-mc lp-reveal">
            <div className="lp-mc-n">Module 01</div>
            <div className="lp-mc-icon">
              <svg viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="lp-mc-name">Medical Chat Agent</div>
            <div className="lp-mc-desc">Ask anything health-related in plain language. The AI dynamically adjusts detail — concise or comprehensive — based on what you need. Attach medical images directly in the chat for combined text + vision analysis.</div>
            <div className="lp-pills">
              <span className="lp-pill">Conversational AI</span>
              <span className="lp-pill">Image Attachment</span>
              <span className="lp-pill">Markdown Formatting</span>
              <span className="lp-pill">🔊 Listen Aloud</span>
              <span className="lp-pill">🌐 Translate</span>
            </div>
          </div>
          <div className="lp-mc lp-reveal lp-d1">
            <div className="lp-mc-n">Module 02</div>
            <div className="lp-mc-icon">
              <svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
            </div>
            <div className="lp-mc-name">Vision Prediction</div>
            <div className="lp-mc-desc">Drag and drop any medical image — X-rays, MRIs, ECGs — up to 10MB. The AI returns a detailed written assessment of visible findings. Hit "Discuss in Chat" to carry the result into a live conversation.</div>
            <div className="lp-pills">
              <span className="lp-pill">Drag & Drop Upload</span>
              <span className="lp-pill">Up to 10MB</span>
              <span className="lp-pill">AI Finding Report</span>
              <span className="lp-pill">→ Discuss in Chat</span>
            </div>
          </div>
          <div className="lp-mc lp-reveal lp-d2">
            <div className="lp-mc-n">Module 03</div>
            <div className="lp-mc-icon">
              <svg viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h4M5 8h14M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <div className="lp-mc-name">Symptom Diagnosis</div>
            <div className="lp-mc-desc">Pick from a curated symptom list or type your own. The AI produces a structured probabilistic triage report — likely conditions, severity signals, and guidance.</div>
            <div className="lp-pills">
              <span className="lp-pill">Guided Symptom Input</span>
              <span className="lp-pill">Triage Report</span>
              <span className="lp-pill">Probabilistic Language</span>
              <span className="lp-pill">→ Carry to Chat</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-feat-bg" id="features">
        <div className="lp-tc">
          <div className="lp-tag">Built-in Features</div>
          <h2 className="lp-title" style={{color: 'white'}}>The Details That Matter.</h2>
          <p className="lp-sub" style={{ color: 'rgba(255,255,255,0.45)' }}>Every feature exists for a reason — safety, accessibility, or focus.</p>
        </div>
        <div className="lp-feat-grid">
          <div className="lp-fc lp-reveal">
            <div className="lp-fc-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="1.8"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></div>
            <div className="lp-fc-title">Text-to-Speech Responses</div>
            <div className="lp-fc-desc">Listen to any AI response read aloud using Sarvam AI. High quality multi-lingual voices are used automatically.</div>
          </div>
          <div className="lp-fc lp-reveal lp-d1">
            <div className="lp-fc-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" stroke="currentColor" strokeWidth="1.8"/></svg></div>
            <div className="lp-fc-title">Hindi & Telugu Translation</div>
            <div className="lp-fc-desc">Instantly translate any AI response into Hindi or Telugu right from the message — no copy-pasting or switching tabs needed.</div>
          </div>
          <div className="lp-fc lp-reveal lp-d2">
            <div className="lp-fc-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="lp-fc-title">Emergency Detection</div>
            <div className="lp-fc-desc">A backend safety layer intercepts queries involving serious emergencies — chest pain, stroke signs — and immediately directs the user to seek emergency care before proceeding.</div>
          </div>
          <div className="lp-fc lp-reveal">
            <div className="lp-fc-icon"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></div>
            <div className="lp-fc-title">Immersive Full-Screen Mode</div>
            <div className="lp-fc-desc">Press <kbd>F</kbd> to hide the header and footer and take the chat interface full-screen for deep focus. Press <kbd>Esc</kbd> to exit anytime.</div>
          </div>
          <div className="lp-fc lp-reveal lp-d1">
            <div className="lp-fc-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="lp-fc-title">Persistent Session State</div>
            <div className="lp-fc-desc">Freely switch between Chat, Vision, and Diagnosis — your inputs and AI results stay exactly where you left them. Nothing resets until you clear it.</div>
          </div>
          <div className="lp-fc lp-reveal lp-d2">
            <div className="lp-fc-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="lp-fc-title">Live Connection Status</div>
            <div className="lp-fc-desc">The frontend periodically pings the backend and shows a live connection indicator in the header — so you always know the system is running.</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-how-bg" id="how">
        <div className="lp-tc">
          <div className="lp-tag">How It Works</div>
          <h2 className="lp-title" style={{color: 'inherit'}}>Start in Four Steps.</h2>
          <p className="lp-sub">No account. No setup. Open the portal and you're in.</p>
        </div>
        <div className="lp-steps">
          <div className="lp-si lp-reveal">
            <div className="lp-sc">
              <div className="lp-sn">1</div>
              <svg viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="lp-s-title">Open the Portal</div>
            <div className="lp-s-desc">Hit "Launch Portal." No account or sign-in needed — you're immediately in.</div>
          </div>
          <div className="lp-si lp-reveal lp-d1">
            <div className="lp-sc">
              <div className="lp-sn">2</div>
              <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>
            </div>
            <div className="lp-s-title">Pick a Module</div>
            <div className="lp-s-desc">Choose between Chat, Vision Prediction, or Symptom Diagnosis from the top tab bar.</div>
          </div>
          <div className="lp-si lp-reveal lp-d2">
            <div className="lp-sc">
              <div className="lp-sn">3</div>
              <svg viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="lp-s-title">Ask or Upload</div>
            <div className="lp-s-desc">Type a question, describe your symptoms, or drag and drop a medical image.</div>
          </div>
          <div className="lp-si lp-reveal lp-d3">
            <div className="lp-sc">
              <div className="lp-sn">4</div>
              <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="lp-s-title">Get Your Answer</div>
            <div className="lp-s-desc">Read the AI report, listen to it in English/Hindi/Telugu, or carry the result into Chat for follow-up.</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-bg" id="launch">
        <h2 className="lp-title" style={{color: 'white'}}>Ready to Try It?</h2>
        <p className="lp-ctap">Open Diagnos AI right now. No account required — just instant, intelligent medical assistance.</p>
        <button onClick={onStart} className="lp-btn-wh">
          Launch Diagnos AI →
        </button>
        <div className="lp-cta-note">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1L8 4.5H12L9 7L10 11L6.5 9L3 11L4 7L1 4.5H5L6.5 1Z" fill="currentColor"/></svg>
          Free forever · No sign-in · Works on any device
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="lp-ft">
          <a href="#" className="lp-fl">
            <div className="lp-logo-icon">
              <svg viewBox="0 0 20 20" fill="none"><path d="M2 10h4l2-5 3 10 2-6 1.5 3H18" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            Diagnos AI
          </a>
          <div className="lp-fnav">
            <a href="#modules">Modules</a>
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
          </div>
        </div>
        <div className="lp-fdiv"></div>
        <div className="lp-fb">
          <div className="lp-fc2">© 2026 Diagnos AI. Open-access project.</div>
          <div className="lp-fdis">⚠ Diagnos AI is an educational tool only. It does not provide medical diagnoses. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
