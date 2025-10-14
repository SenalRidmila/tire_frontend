import React from 'react';
import './Contact.css';

function Contact() {
  return (
    <div className="contact-page">
      <header
        className="contact-hero"
        style={{
          backgroundImage: "url('/images/logo.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="overlay"></div>
        <div className="hero-text">
          <h1>Get in Touch</h1>
          <p>We’re here to help with your tire management needs.</p>
        </div>
      </header>

      <section className="contact-form-section">
        <div className="form-container">
          <h2>Contact Us</h2>
          <form className="contact-form">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" rows="5" required></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>
        <div className="contact-info">
          <h3>📞 Phone --- +94 112 021 000</h3>
          

          <h3>📧 Email --- support@slt.lk</h3>
          

          <h3>📍 Address --- Sri Lanka Telecom PLC , Lotus Road, Colombo 01, Sri Lanka</h3>
          
        </div>
      </section>

      <section className="map-section">
        <h2>Our Location</h2>
        <div className="map-placeholder">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d63371.52081029811!2d79.87491394999999!3d6.9240302!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sSri%20Lanka%20Telecom%20PLC%20Colombo!5e0!3m2!1sen!2slk!4v1746096653110!5m2!1sen!2slk"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: '10px' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="SLT Google Map"
          ></iframe>
        </div>
      </section>

      <footer className="contact-footer">
        <p>© 2025 SLT Tire Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Contact;
