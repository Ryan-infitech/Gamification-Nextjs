'use client';

import React, { ReactNode } from 'react';
import { useRole, Role, Permission } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';

type RoleBasedAccessProps = {
  /**
   * Children yang akan dirender jika user memiliki hak akses
   */
  children: ReactNode;
  
  /**
   * Role yang dibolehkan mengakses children
   */
  allowedRoles?: Role | Role[];
  
  /**
   * Permission yang dibolehkan mengakses children
   */
  requiredPermissions?: Permission | Permission[];
  
  /**
   * Component/element yang akan dirender jika user tidak memiliki hak akses
   */
  fallback?: ReactNode;
  
  /**
   * Apakah harus sudah terautentikasi untuk mengakses children
   * @default true
   */
  requireAuth?: boolean;
};

/**
 * Component untuk menampilkan children secara kondisional berdasarkan role atau permission user
 */
export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
  fallback = null,
  requireAuth = true
}) => {
  const { isAuthenticated } = useAuth();
  const { hasRole, hasPermission } = useRole();
  
  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }
  
  // If no role/permission checks are specified, just return the children
  if (!allowedRoles && !requiredPermissions) {
    return <>{children}</>;
  }
  
  // Check roles if specified
  if (allowedRoles) {
    if (!hasRole(allowedRoles)) {
      return <>{fallback}</>;
    }
  }
  
  // Check permissions if specified
  if (requiredPermissions) {
    if (!hasPermission(requiredPermissions)) {
      return <>{fallback}</>;
    }
  }
  
  // If all checks pass, render the children
  return <>{children}</>;
};

/**
 * Component yang hanya menampilkan children untuk admin
 */
export const AdminOnly: React.FC<Omit<RoleBasedAccessProps, 'allowedRoles'>> = (props) => (
  <RoleBasedAccess {...props} allowedRoles="admin" />
);

/**
 * Component yang hanya menampilkan children untuk teacher
 */
export const TeacherOnly: React.FC<Omit<RoleBasedAccessProps, 'allowedRoles'>> = (props) => (
  <RoleBasedAccess {...props} allowedRoles={['teacher', 'admin']} />
);

/**
 * Component yang hanya menampilkan children untuk student
 */
export const StudentOnly: React.FC<Omit<RoleBasedAccessProps, 'allowedRoles'>> = (props) => (
  <RoleBasedAccess {...props} allowedRoles="student" />
);

/**
 * Component yang hanya menampilkan children untuk user yang terautentikasi
 */
export const AuthenticatedOnly: React.FC<Omit<RoleBasedAccessProps, 'requireAuth'>> = (props) => (
  <RoleBasedAccess {...props} requireAuth={true} />
);

/**
 * Component yang hanya menampilkan children untuk user yang tidak terautentikasi
 */
export const UnauthenticatedOnly: React.FC<Omit<RoleBasedAccessProps, 'requireAuth'>> = ({ 
  children, 
  fallback = null
}) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * Component yang menampilkan children untuk user dengan permission tertentu
 */
export const PermissionRequired: React.FC<
  Omit<RoleBasedAccessProps, 'requiredPermissions'> & {
    permissions: Permission | Permission[];
  }
> = ({ permissions, ...props }) => (
  <RoleBasedAccess {...props} requiredPermissions={permissions} />
);

export default RoleBasedAccess;
