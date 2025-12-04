// Background particles component

import { useEffect } from 'react';
import './Particles.css';

export function Particles() {
    useEffect(() => {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        // Create 30 floating particles
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 20}s;
        animation-duration: ${15 + Math.random() * 10}s;
      `;
            particlesContainer.appendChild(particle);
        }

        // Cleanup
        return () => {
            if (particlesContainer) {
                particlesContainer.innerHTML = '';
            }
        };
    }, []);

    return <div className="particles" id="particles" />;
}
