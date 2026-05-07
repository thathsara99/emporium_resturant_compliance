import React, { useState, useEffect  } from "react";
import {
  Layout, Menu, Switch, Avatar, Typography, Space, Dropdown, Drawer, Button, Grid, message
} from "antd";
import {
  UserOutlined, HomeOutlined, InfoCircleOutlined, LogoutOutlined, MenuOutlined,
  SlackCircleFilled,
  MoneyCollectFilled,
  CalendarFilled,
  WalletFilled,
  TeamOutlined,
  CompassFilled,
  FolderAddFilled,
  IdcardOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  ShopOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import { isTokenValid, clearAuthToken, getTimeUntilExpiry, formatTimeRemaining, getCurrentUserRole } from "../utils/auth";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MainLayout = ({ children, onLogout }) => {
  
  const [darkMode, setDarkMode] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const currentRole = getCurrentUserRole();
  const canManageUsersAndDepartments = ['HR Manager', 'Super Admin', 'System Admin'].includes(currentRole);
  const canAccessSuppliers = ['Super Admin', 'HR Admin', 'HR Manager', 'HR', 'System Admin', 'Company Admin'].includes(currentRole);

  // Function to fetch user profile data
  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { ...getAuthHeaders() },
      });
      const result = await res.json();
      if (res.ok && result.data) {
        setUserProfile(result.data);
        console.log('Profile data loaded in MainLayout:', result.data.firstName);
      }
    } catch (err) {
      console.error('Error fetching user profile in MainLayout:', err);
    }
  };

  // Fetch user profile data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Refresh profile data when navigating to profile page
  useEffect(() => {
    const handleRouteChange = () => {
      // Refresh profile data when user navigates to profile page
      if (window.location.pathname === '/profile') {
        fetchUserProfile();
      }
    };

    const handleProfileUpdate = () => {
      // Refresh profile data when profile is updated
      console.log('Profile updated event received, refreshing profile data...');
      fetchUserProfile();
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for profile update events
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    // Also refresh when component mounts
    fetchUserProfile();

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const checkTokenExpiry = () => {
      if (!isTokenValid()) {
        // Token expired or doesn't exist
        if (onLogout) {
          onLogout();
        } else {
          clearAuthToken();
        }
        message.warning("Your session has expired. Please log in again.");
        navigate("/login");
      } else {
        // Check if session is about to expire (within 30 minutes)
        const timeUntilExpiry = getTimeUntilExpiry();
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        if (timeUntilExpiry > 0 && timeUntilExpiry <= thirtyMinutes) {
          setShowSessionWarning(true);
        } else {
          setShowSessionWarning(false);
        }
      }
    };

    // Check on load
    checkTokenExpiry();

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate, onLogout]);

  const headerBgColor = '#2d2018';
  const headerTextColor = 'rgba(255, 246, 234, 0.92)';

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      clearAuthToken();
    }
    navigate('/login');
  };
  

  const userMenu = (
    <Menu
      items={[
        {
          key: '1',
          label: 'Profile',
          icon: <UserOutlined />,
          onClick: () => navigate('/profile')
        },
        { type: 'divider' },
        {
          key: '2',
          label: 'Company Profile',
          icon: <CompassFilled />,
          onClick: () => navigate('/companyprofile')
        },
        { type: 'divider' },
        {
          key: '3',
          label: 'Logout',
          icon: <LogoutOutlined />,
          onClick: handleLogout
        }
      ]}
    />
  );

  const menuItems = [
    {
      key: "1",
      label: <Link to="/home" onClick={() => setDrawerVisible(false)}>Dashboard</Link>,
      icon: <HomeOutlined />
    },
    ...(canManageUsersAndDepartments ? [{
      key: "2",
      label: <Link to="/department" onClick={() => setDrawerVisible(false)}>Department</Link>,
      icon: <TeamOutlined />
    }] : []),
    ...(canManageUsersAndDepartments ? [{
      key: "3",
      label: <Link to="/users" onClick={() => setDrawerVisible(false)}>Users</Link>,
      icon: <UserOutlined />
    }] : []),
    {
      key: "4",
      label: <Link to="/employee" onClick={() => setDrawerVisible(false)}>Employee Management</Link>,
      icon: <IdcardOutlined />
    },
    {
      key: "5",
      label: <Link to="/documents" onClick={() => setDrawerVisible(false)}>Document Hub</Link>,
      icon: <FolderAddFilled />
    },
    {
      key: "6",
      label: <Link to="/leave" onClick={() => setDrawerVisible(false)}>Leave Management</Link>,
      icon: <CalendarFilled />
    },
    {
      key: "7",
      label: <Link to="/attendance" onClick={() => setDrawerVisible(false)}>Attendance</Link>,
      icon: <ClockCircleOutlined />
    },
    {
      key: "8",
      label: <Link to="/tasks" onClick={() => setDrawerVisible(false)}>Task Manager</Link>,
      icon: <CheckSquareOutlined />
    },
    {
      key: "11",
      label: <Link to="/shifts" onClick={() => setDrawerVisible(false)}>Shift Management</Link>,
      icon: <ScheduleOutlined />
    },
    ...(canAccessSuppliers ? [{
      key: "9",
      label: <Link to="/suppliers" onClick={() => setDrawerVisible(false)}>Supplier Management</Link>,
      icon: <ShopOutlined />
    }] : []),
    {
      key: "10",
      label: <Link to="/customers" onClick={() => setDrawerVisible(false)}>{currentRole === 'Employee' ? 'My Customers' : 'Customer Management'}</Link>,
      icon: <TeamOutlined />
    },
  ];

  const getSelectedMenuKey = (pathname) => {
    if (pathname === '/' || pathname === '/home') return '1';
    if (pathname.startsWith('/department')) return '2';
    if (pathname.startsWith('/users')) return '3';
    if (pathname.startsWith('/employee')) return '4';
    if (pathname.startsWith('/documents')) return '5';
    if (pathname.startsWith('/leave')) return '6';
    if (pathname.startsWith('/attendance')) return '7';
    if (pathname.startsWith('/tasks')) return '8';
    if (pathname.startsWith('/shifts')) return '11';
    if (pathname.startsWith('/suppliers')) return '9';
    if (pathname.startsWith('/customers')) return '10';
    return '1';
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#9f6736',
          colorInfo: '#9f6736',
          colorSuccess: '#5f8f3b',
          colorWarning: '#d18a2c',
          colorError: '#c4493f',
          borderRadius: 12,
          wireframe: false,
        }
      }}
    >
      <Layout
        className="restaurant-admin-shell"
        style={{
          minHeight: "100vh",
          backgroundImage: `
            radial-gradient(circle at 8% 12%, rgba(210, 162, 101, 0.14), transparent 34%),
            radial-gradient(circle at 92% 88%, rgba(117, 69, 44, 0.16), transparent 36%),
            linear-gradient(160deg, #fbf6ef 0%, #f6ede0 45%, #f2e7d8 100%)
          `,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <Header
          className="modern-admin-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: '0 18px',
            height: 72,
            backgroundColor: headerBgColor,
            zIndex: 1000,
            margin: '14px 16px 0',
            borderRadius: 16,
            border: '1px solid rgba(214, 176, 117, 0.28)',
            boxShadow: '0 14px 32px rgba(49, 31, 21, 0.24)'
          }}
        >
          <div className="modern-admin-left">
            <Link to="/home" className="modern-admin-brand">
              <div className="modern-admin-brand-dot" />
              <span className="modern-admin-brand-text">Vintage Tea Emporium</span>
            </Link>
            {!isMobile && (
              <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[getSelectedMenuKey(location.pathname)]}
                items={menuItems}
                className="modern-admin-nav modern-admin-nav-desktop"
                style={{
                  backgroundColor: 'transparent',
                  borderBottom: 'none',
                  lineHeight: '72px'
                }}
              />
            )}
          </div>

          <Space size={12} className="modern-admin-right">
            <div className="modern-theme-toggle-wrap">
              <span className={`toggle-label ${darkMode ? 'active' : ''}`}>Dark</span>
              <Switch
                checked={darkMode}
                onChange={setDarkMode}
                checkedChildren="🌙"
                unCheckedChildren="☀️"
                className="modern-theme-toggle"
              />
              <span className={`toggle-label ${!darkMode ? 'active' : ''}`}>Light</span>
            </div>
            <Dropdown overlay={userMenu} trigger={['click']}>
              <Avatar
                src={userProfile?.profilePicture}
                icon={<UserOutlined />}
                style={{ cursor: 'pointer', backgroundColor: '#9f6736' }}
                onError={() => {
                  // If image fails to load, it will show the icon instead
                  console.log('Profile picture failed to load in MainLayout, showing default icon');
                }}
              />
            </Dropdown>
            {isMobile && (
              <Button
                icon={<MenuOutlined style={{ color: '#fff7ef' }} />}
                type="text"
                onClick={() => setDrawerVisible(true)}
              />
            )}
          </Space>
        </Header>

        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          className="modern-admin-drawer"
          bodyStyle={{ padding: 0 }}
        >
          <Menu
            mode="vertical"
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Drawer>

        <Content style={{
          margin: "24px 16px",
          padding: 24,
          minHeight: 280,
          background: darkMode ? "#141414" : "rgba(255, 251, 245, 0.88)",
          borderRadius: 16,
          backdropFilter: 'blur(8px)',
          border: darkMode ? '1px solid #2d2d2d' : '1px solid rgba(186, 143, 94, 0.22)',
          boxShadow: '0 18px 40px rgba(61, 40, 27, 0.08)'
        }}>
          {showSessionWarning && (
            <div style={{
              backgroundColor: '#fff2e8',
              border: '1px solid #ffbb96',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#d46b08' }}>
                ⚠️ Your session will expire in {formatTimeRemaining(getTimeUntilExpiry())}. 
                Please save your work and log in again if needed.
              </span>
              <Button 
                size="small" 
                type="link" 
                onClick={() => setShowSessionWarning(false)}
                style={{ color: '#d46b08' }}
              >
                Dismiss
              </Button>
            </div>
          )}
          {children}
        </Content>

        <Footer style={{
          textAlign: 'center',
          background: darkMode ? '#1f1f1f' : '#f0f2f5',
          padding: '16px 0',
          borderTop: `1px solid ${darkMode ? '#303030' : '#e8e8e8'}`,
          color: darkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'
        }}>
          Vintage Tea Emporium ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
