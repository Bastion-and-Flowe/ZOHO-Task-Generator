import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      department: string;
      subDepartment: string;
    };
  }
  interface User {
    id: string;
    department: string;
    subDepartment: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    department: string;
    subDepartment: string;
  }
}
