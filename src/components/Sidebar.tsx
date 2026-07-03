import React, { useState } from 'react';
import { 
  Home, 
  Box, 
  ShoppingCart, 
  FileText, 
  MapPin, 
  FileSpreadsheet, 
  UserCheck, 
  Users, 
  CreditCard, 
  Wallet, 
  Calculator, 
  Bell, 
  Settings, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string, title: string) => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: any;
  children?: { id: string; title: string }[];
}

export default function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  // Track expanded state for menu groups
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'order': true,     // Expand Order Management by default
    'finance': true,   // Expand Finance by default
    'cashier-desk': false,
    'product': false,
    'purchase': false,
    'agreement': false,
    'address': false,
    'cashier': false,
    'advisor': false,
    'deposit': false,
    'notification': false,
  });

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const menuStructure: MenuItem[] = [
    { id: 'home', title: '首页', icon: Home },
    { 
      id: 'product', 
      title: '商品库存管理', 
      icon: Box,
      children: [
        { id: 'product-list', title: '商品列表' },
        { id: 'stock-log', title: '库存日志' }
      ]
    },
    { 
      id: 'purchase', 
      title: '采购管理', 
      icon: ShoppingCart,
      children: [
        { id: 'purchase-order', title: '采购单管理' }
      ]
    },
    { 
      id: 'agreement', 
      title: '协议管理', 
      icon: FileText,
      children: [
        { id: 'agreement-list', title: '协议列表' }
      ]
    },
    { 
      id: 'address', 
      title: '收货地址管理', 
      icon: MapPin,
      children: [
        { id: 'address-list', title: '收货地址' }
      ]
    },
    { 
      id: 'order', 
      title: '订单管理', 
      icon: FileSpreadsheet,
      children: [
        { id: 'order-list', title: '订单管理' },
        { id: 'refund-list', title: '退款单管理' } // REQ 3: 退款单管理
      ]
    },
    { 
      id: 'cashier', 
      title: '收银员管理', 
      icon: UserCheck,
      children: [
        { id: 'cashier-list', title: '收银员列表' }
      ]
    },
    { 
      id: 'advisor', 
      title: '护理顾问管理', 
      icon: Users,
      children: [
        { id: 'advisor-list', title: '护理顾问列表' }
      ]
    },
    { 
      id: 'deposit', 
      title: '保证金管理', 
      icon: CreditCard,
      children: [
        { id: 'deposit-list', title: '保证金记录' }
      ]
    },
    { 
      id: 'finance', 
      title: '财务管理', 
      icon: Wallet,
      children: [
        { id: 'revenue-list', title: '收益管理' }, // REQ 4: 收益管理
        { id: 'sub-revenue', title: '查看下级收益' },
        { id: 'commission-ratio', title: '护理顾问分佣比例管理' },
        { id: 'withdraw-settings', title: '提现设置管理' }
      ]
    },
    { 
      id: 'cashier-desk', 
      title: '收银台', 
      icon: Calculator,
      children: [
        { id: 'checkout', title: '收银' },
        { id: 'invoice-list', title: '发票管理' }
      ]
    },
    { 
      id: 'notification', 
      title: '系统通知', 
      icon: Bell,
      children: [
        { id: 'notification-list', title: '消息列表' }
      ]
    },
    { id: 'settings', title: '设置', icon: Settings }
  ];

  const handleItemClick = (id: string, title: string) => {
    onSelectTab(id, title);
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full select-none shrink-0 overflow-y-auto overflow-x-hidden text-[13px] text-slate-600">
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuStructure.map((menu) => {
          const IconComponent = menu.icon;
          const hasChildren = menu.children && menu.children.length > 0;
          const isExpanded = expandedMenus[menu.id];
          const isParentActive = activeTab === menu.id || (hasChildren && menu.children?.some(c => c.id === activeTab));

          return (
            <div key={menu.id} className="space-y-0.5">
              {/* Parent Item */}
              <div 
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group ${
                  activeTab === menu.id 
                    ? 'bg-blue-50 text-blue-600 font-semibold' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
                onClick={() => {
                  if (hasChildren) {
                    toggleMenu(menu.id);
                  } else {
                    handleItemClick(menu.id, menu.title);
                  }
                }}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent className={`w-[17px] h-[17px] transition-colors duration-150 ${
                    isParentActive
                      ? 'text-blue-600' 
                      : 'text-slate-400 group-hover:text-slate-500'
                  }`} />
                  <span className="font-medium">{menu.title}</span>
                </div>
                {hasChildren && (
                  <div>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Submenu Items */}
              {hasChildren && isExpanded && (
                <div className="pl-8 pr-1 py-0.5 space-y-0.5 border-l border-slate-100 ml-4.5 mt-0.5">
                  {menu.children!.map((subItem) => {
                    const isSubActive = activeTab === subItem.id;
                    return (
                      <div
                        key={subItem.id}
                        className={`group flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-all duration-150 truncate ${
                          isSubActive
                            ? 'text-blue-600 bg-blue-50/70 font-semibold'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        onClick={() => handleItemClick(subItem.id, subItem.title)}
                      >
                        <span className="truncate">{subItem.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      {/* Footer credits mimicking the design mockup footer */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-400 border border-slate-200">
            AD
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-medium text-slate-800 truncate">管理员 (Admin)</p>
            <p className="text-slate-400">v2.4.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
