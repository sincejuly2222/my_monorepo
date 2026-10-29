import {
  ContactsOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ProLayout, type MenuDataItem } from "@ant-design/pro-components";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const menuRoutes: MenuDataItem[] = [
  {
    path: "/dashboard",
    name: "工作台",
    icon: <DashboardOutlined />,
  },
  {
    path: "/users",
    name: "用户管理",
    icon: <ContactsOutlined />,
  },
  {
    path: "/roles",
    name: "角色管理",
    icon: <TeamOutlined />,
  },
];

/**
 * 后台管理系统的公共布局，负责侧边菜单、顶部栏和内容区域。
 */
export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ProLayout
      title="后台管理系统"
      logo={
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
          A
        </div>
      }
      layout="side"
      location={location}
      route={{
        path: "/",
        routes: menuRoutes,
      }}
      menu={{ locale: false }}
      fixedHeader
      fixSiderbar
      contentWidth="Fluid"
      avatarProps={{
        icon: <UserOutlined />,
        title: "管理员",
      }}
      onMenuHeaderClick={() => navigate("/dashboard")}
      menuItemRender={(item, defaultDom) =>
        item.path ? <Link to={item.path}>{defaultDom}</Link> : defaultDom
      }
      footerRender={() => (
        <div className="py-4 text-center text-sm text-gray-500">
          后台管理系统
        </div>
      )}
    >
      <Outlet />
    </ProLayout>
  );
}
