export namespace ModelsAuth{
    export const PathUsers = 'Users'
    
    export interface DatosRegistro {
        email: string;
        password: string;
    }

    export interface DatosLogin {
        email: string;
        password: string;
    }

    export interface UserProfile {
        id: string,       
        nombre: string;
        apellido: string;
        telefono: string;     
        direccion: string;
        region: string;
        email: string;
        password: string;
        confirmPassword?: string; 
    }

    export interface UpdateProfileI{
        displayName?: string,
        photoURL?: string
    }
}