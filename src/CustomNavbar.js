import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const CustomNavbar = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(localStorage.getItem('role') ? localStorage.getItem('role').toLowerCase() : null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Add ref for dropdown menu
  const dropdownRef = useRef(null);

  // Debug info
  useEffect(() => {
    console.log('Auth state:', { isLoggedIn, userRole, token: localStorage.getItem('token') });
  }, [isLoggedIn, userRole]);

  useEffect(() => {
    console.log('Dropdown state:', isDropdownOpen);
  }, [isDropdownOpen]);

  useEffect(() => {
    // Handle auth state changes
    const handleStorageChange = () => {
      const role = localStorage.getItem('role');
      const token = localStorage.getItem('token');
      setUserRole(role ? role.toLowerCase() : null);
      setIsLoggedIn(!!token);
    };

    // Update cart and wishlist counts
    const updateCounts = () => {
      const cartCountFromStorage = localStorage.getItem('cartCount');
      const wishlistCountFromStorage = localStorage.getItem('wishlistCount');
      
      setCartCount(cartCountFromStorage ? parseInt(cartCountFromStorage) : 0);
      setWishlistCount(wishlistCountFromStorage ? parseInt(wishlistCountFromStorage) : 0);
    };

    // Handle scroll for navbar appearance
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    // Initialize counts
    updateCounts();

    // Subscribe to events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setUserRole(null);
    setIsDropdownOpen(false);
    navigate('/');
  };

  const toggleDropdown = () => {
    // No more preventDefault or stopPropagation
    console.log('Toggling dropdown, current state:', isDropdownOpen);
    setIsDropdownOpen(prevState => !prevState);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigateToProfile = () => {
    console.log('Navigating to profile...');
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleNavigateToAdmin = () => {
    console.log('Navigating to admin...');
    setIsDropdownOpen(false);
    navigate('/admin');
  };

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Brand Logo */}
          <Link to="/" className="navbar-brand">
            <span className="brand-text">market</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className={`toggle-icon ${isMobileMenuOpen ? 'open' : ''}`}></span>
          </button>
          
          {/* Main Navigation */}
          <div className={`navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`}>
            {/* Main Links */}
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Главная
                </Link>
              </li>
            </ul>

            {/* Right Side Icons and Auth */}
            <div className="navbar-actions">
              {/* Wishlist */}
              <Link to="/wishlist" className="action-icon" onClick={() => setIsMobileMenuOpen(false)}>
                <svg viewBox="0 0 24 24" className="icon">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="badge wishlist-badge">{wishlistCount}</span>
                )}
                <span className="action-text">Желаемое</span>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="action-icon" onClick={() => setIsMobileMenuOpen(false)}>
                <svg viewBox="0 0 24 24" className="icon">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                {cartCount > 0 && (
                  <span className="badge cart-badge">{cartCount}</span>
                )}
                <span className="action-text">Корзина</span>
              </Link>

              {/* Auth Links - Login/Register or User Menu */}
              {isLoggedIn ? (
                <div className="user-menu-container" ref={dropdownRef}>
                  <button 
                    type="button"
                    className="user-menu-button" 
                    onClick={toggleDropdown}
                  >
                    <svg viewBox="0 0 24 24" className="icon">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                    <span className="action-text">Аккаунт</span>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="dropdown-menu" style={{display: "block"}}>
                      <button 
                        type="button"
                        className="dropdown-item"
                        onClick={handleNavigateToProfile}
                      >
                        Профиль
                      </button>
                      {userRole === 'admin' && (
                        <button 
                          type="button"
                          className="dropdown-item"
                          onClick={handleNavigateToAdmin}
                        >
                          Админ панель
                        </button>
                      )}
                      <button 
                        type="button"
                        className="dropdown-item" 
                        onClick={handleLogout}
                      >
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link 
                    to="/login" 
                    className="auth-button login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link 
                    to="/register" 
                    className="auth-button register"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default CustomNavbar;