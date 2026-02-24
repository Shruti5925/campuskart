import React from 'react';
import Footer from '../Components/Footer';

const Guidelines = () => {
    return (
        <div className="guidelines-container" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* Blank content as requested */}
            <main style={{ flex: 1, padding: '10rem 2rem', textAlign: 'center' }}>
                <h1 style={{ color: '#64748b', fontSize: '2rem', fontWeight: '500' }}>Guidelines</h1>
                <p style={{ color: '#94a3b8', marginTop: '1rem' }}>Content coming soon...</p>
            </main>
            <Footer />
        </div>
    );
};

export default Guidelines;
