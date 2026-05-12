import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

type SidebarState = 'expanded' | 'collapsed' | 'closed';

interface SidebarContextValue {
    state: SidebarState;
    isOpen: boolean;
    isCollapsed: boolean;
    isExpanded: boolean;
    isMobileOpen: boolean;
    toggle: () => void;
    collapse: () => void;
    expand: () => void;
    close: () => void;
    openMobile: () => void;
    closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

function getInitialState(): SidebarState {
    if (typeof window === 'undefined') return 'expanded';
    if (window.innerWidth < 768) return 'closed';
    if (window.innerWidth < 1024) return 'collapsed';
    return 'expanded';
}

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<SidebarState>(getInitialState);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setState('closed');
                setIsMobileOpen(false);
            } else if (window.innerWidth < 1024) {
                setState('collapsed');
                setIsMobileOpen(false);
            } else {
                setState('expanded');
                setIsMobileOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggle = useCallback(() => {
        setState((s) => (s === 'expanded' ? 'collapsed' : 'expanded'));
    }, []);

    const collapse = useCallback(() => setState('collapsed'), []);
    const expand = useCallback(() => setState('expanded'), []);
    const close = useCallback(() => setState('closed'), []);
    const openMobile = useCallback(() => setIsMobileOpen(true), []);
    const closeMobile = useCallback(() => setIsMobileOpen(false), []);

    return (
        <SidebarContext.Provider
            value={{
                state,
                isOpen: state !== 'closed',
                isCollapsed: state === 'collapsed',
                isExpanded: state === 'expanded',
                isMobileOpen,
                toggle,
                collapse,
                expand,
                close,
                openMobile,
                closeMobile,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used inside SidebarProvider');
    }
    return context;
}
