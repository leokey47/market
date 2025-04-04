import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const CustomNavbar = () => {
  const [userRole, setUserRole] = useState(localStorage.getItem('role') ? localStorage.getItem('role').toLowerCase() : null);

  useEffect(() => {
    const handleStorageChange = () => {
      const role = localStorage.getItem('role');
      setUserRole(role ? role.toLowerCase() : null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (userRole === 'admin') return null; // Скрываем Navbar для админа

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">market</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">Главное меню</Nav.Link>
            {userRole === 'user' && <Nav.Link as={Link} to="/profile">Профиль</Nav.Link>}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
