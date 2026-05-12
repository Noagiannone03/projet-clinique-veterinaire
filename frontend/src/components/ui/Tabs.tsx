import { useState } from 'react';

export interface Tab {
    key: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
}

interface TabsProps {
    tabs: Tab[];
    activeTab?: string;
    onChange?: (key: string) => void;
    children?: (activeTab: string) => React.ReactNode;
}

export function Tabs({ tabs, activeTab: controlledTab, onChange, children }: TabsProps) {
    const [internalTab, setInternalTab] = useState(tabs[0]?.key || '');
    const activeTab = controlledTab ?? internalTab;

    const handleChange = (key: string) => {
        if (onChange) onChange(key);
        else setInternalTab(key);
    };

    return (
        <div>
            <div className="flex border-b border-slate-200 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleChange(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === tab.key
                                ? 'border-primary-600 text-primary-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            {children && <div className="mt-4">{children(activeTab)}</div>}
        </div>
    );
}
