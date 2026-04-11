// src/models/Role.ts
export interface Role {
    role_id: number;
    name: string;
    description: string | null;
    created_at?: string;
    updated_at?: string;
}

// Interface pour la réponse paginée de Laravel
export interface RoleResponse {
    status: string;
    data: {
        current_page: number;
        data: Role[];
        first_page_url: string;
        from: number;
        last_page: number;
        last_page_url: string;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        next_page_url: string | null;
        path: string;
        per_page: number;
        prev_page_url: string | null;
        to: number;
        total: number;
    };
}

// Type pour la création/modification
export type RolePayload = Omit<Role, 'role_id' | 'created_at' | 'updated_at'>;