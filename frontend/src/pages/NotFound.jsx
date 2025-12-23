import React from 'react';

function NotFound() {
    return (
        <div className="container text-center mt-5">
            <h1 className="display-1 text-danger">404</h1>
            <h2 className="display-4">Page Non Trouvée</h2>
            <p className="lead">La page que vous recherchez n'existe pas !</p>
        </div>
    );
}

export default NotFound;
