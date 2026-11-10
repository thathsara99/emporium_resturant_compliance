import React, { useState, useEffect  } from "react";
import {
  Layout, Menu, Avatar, Dropdown, Drawer, Button, Grid, message
} from "antd";
import {
  UserOutlined, HomeOutlined, LogoutOutlined, MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  CalendarFilled,
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

const { Content, Footer, Sider } = Layout;
const { useBreakpoint } = Grid;

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MainLayout = ({ children, onLogout }) => {
  
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('vtm-theme') === 'dark');
  const [navHidden, setNavHidden] = useState(() => localStorage.getItem('vtm-nav-hidden') === '1');
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

  useEffect(() => {
    localStorage.setItem('vtm-theme', darkMode ? 'dark' : 'light');
    document.body.classList.toggle('vtm-dark', darkMode);
    return () => document.body.classList.remove('vtm-dark');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('vtm-nav-hidden', navHidden ? '1' : '0');
  }, [navHidden]);

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

  const accountName = userProfile
    ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
    : 'Account';

  const themeAndAccount = (
    <div className="vtm-sider-foot">
      <div className="vtm-theme-switch" role="group" aria-label="Color theme">
        <button type="button" className={!darkMode ? 'is-active' : ''} onClick={() => setDarkMode(false)}>
          Light
        </button>
        <button type="button" className={darkMode ? 'is-active' : ''} onClick={() => setDarkMode(true)}>
          Dark
        </button>
      </div>
      <Dropdown overlay={userMenu} trigger={['click']}>
        <button type="button" className="vtm-account">
          <Avatar
            size="small"
            src={userProfile?.profilePicture}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#9f6736', flexShrink: 0 }}
          />
          <span>{accountName || 'Account'}</span>
        </button>
      </Dropdown>
    </div>
  );

  const themeTokens = darkMode
    ? {
        colorPrimary: '#d7a15a',
        colorInfo: '#d7a15a',
        colorSuccess: '#7dab55',
        colorWarning: '#e0a45a',
        colorError: '#e07a72',
        colorBgBase: '#16110e',
        colorBgContainer: '#241c17',
        colorBgElevated: '#2e241e',
        colorText: '#f7f1ea',
        colorTextSecondary: '#d9c7b6',
        colorBorder: '#4d3b30',
        colorBorderSecondary: '#3b2d25',
        borderRadius: 12,
        wireframe: false,
      }
    : {
        colorPrimary: '#9f6736',
        colorInfo: '#9f6736',
        colorSuccess: '#5f8f3b',
        colorWarning: '#d18a2c',
        colorError: '#c4493f',
        colorBgBase: '#fbf6ef',
        colorBgContainer: '#fffdfb',
        colorText: '#3b2618',
        colorTextSecondary: '#7a5a45',
        colorBorder: '#ead9c6',
        colorBorderSecondary: '#f0e4d6',
        borderRadius: 12,
        wireframe: false,
      };

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: themeTokens,
      }}
    >
      <Layout className={`restaurant-admin-shell ${darkMode ? 'is-dark' : ''}`}>
        {!isMobile && (
          <Sider
            width={260}
            collapsedWidth={0}
            collapsed={navHidden}
            trigger={null}
            className="vtm-sider"
            theme="dark"
          >
            <div className="vtm-sider-brand-row">
              <Link to="/home" className="vtm-sider-brand">
                <span className="modern-admin-brand-dot" />
                <span>
                  <span className="vtm-sider-kicker">Restaurant workspace</span>
                  <span className="vtm-sider-name">Vintage Tea Manager</span>
                </span>
              </Link>
              <button
                type="button"
                className="vtm-nav-toggle"
                aria-label="Hide menu"
                onClick={() => setNavHidden(true)}
              >
                <MenuFoldOutlined />
              </button>
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[getSelectedMenuKey(location.pathname)]}
              items={menuItems}
              className="vtm-sider-menu"
            />
            {themeAndAccount}
          </Sider>
        )}

        <Layout className={`vtm-main ${!isMobile && navHidden ? 'is-nav-hidden' : ''}`}>
          {isMobile && (
            <Button
              className="vtm-menu-fab"
              icon={<MenuOutlined />}
              aria-label="Open menu"
              onClick={() => setDrawerVisible(true)}
            />
          )}
          {!isMobile && navHidden && (
            <Button
              className="vtm-menu-fab"
              icon={<MenuUnfoldOutlined />}
              aria-label="Show menu"
              onClick={() => setNavHidden(false)}
            />
          )}
          <Content className="vtm-content">
            {showSessionWarning && (
              <div className="vtm-session-warning">
                <span>
                  Your session will expire in {formatTimeRemaining(getTimeUntilExpiry())}.
                  Please save your work and log in again if needed.
                </span>
                <Button size="small" type="link" onClick={() => setShowSessionWarning(false)}>
                  Dismiss
                </Button>
              </div>
            )}
            {children}
          </Content>

          <Footer className="vtm-footer">
            Vintage Tea Manager ©{new Date().getFullYear()}
          </Footer>
        </Layout>

        <Drawer
          title="Vintage Tea Manager"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          className="modern-admin-drawer"
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
          width={280}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedMenuKey(location.pathname)]}
            items={menuItems}
            style={{ borderRight: 0, flex: 1, overflow: 'auto', background: 'transparent' }}
          />
          {themeAndAccount}
        </Drawer>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
