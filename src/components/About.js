import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about-page">
      <header
        className="about-hero"
        style={{
          backgroundImage: "url('/images/logo.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="overlay"></div>
        <div className="hero-text">
          <h1>About SLT Tire Management System</h1>
          <p>Innovating tire tracking, safety, and service efficiency for a smarter future.</p>
        </div>
      </header>

      <section className="about-content">
        <h2>Who We Are</h2>
        <p>
          SLT Tire Management System is a smart digital solution developed by Sri Lanka Telecom (SLT)
          to simplify and enhance the management of vehicle tires across both public and private fleets.
        </p>

        <h2>Our Mission</h2>
        <p>
          To provide reliable, secure, and intelligent tools for tracking, maintaining, and requesting tire
          replacements—ensuring vehicle readiness and extending tire life through timely data-driven interventions.
        </p>

        <h2>Key Features</h2>
        <ul>
          <li>🔍 Real-time tire status tracking and history</li>
          <li>🛠️ Easy tire service request submissions</li>
          <li>📦 Inventory and cost center management</li>
          <li>📊 Data analytics for tire usage patterns</li>
          <li>📁 Upload documents and inspection images</li>
        </ul>
      </section>

      <section className="team-section">
        <h2>Meet Our Team</h2>
        <div className="team-cards">
          <div className="card">
            <img src="/images/team1.jpeg" alt="Team member" />
            <h4>Nimal Perera</h4>
            <p>Project Manager</p>
          </div>
          <div className="card">
            <img src="/images/team2.jpeg" alt="Team member" />
            <h4>Sachini Herath</h4>
            <p>Lead Developer</p>
          </div>
          <div className="card">
            <img src="/images/team3.jpeg" alt="Team member" />
            <h4>Dinuka Silva</h4>
            <p>UI/UX Designer</p>
          </div>
        </div>
      </section>

      <footer className="about-footer">
        <p>📞 +94 112 021 000 | 📧 support@slt.lk | © 2025 SLT Tire Management System</p>
      </footer>
    </div>
  );
}

export default About;
