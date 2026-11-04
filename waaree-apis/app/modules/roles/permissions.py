from app.core.permissions import Permission

PERMISSIONS = [
    Permission("roles.view", "See roles and what each one can do", default_roles=("Admin",)),
    Permission("roles.manage", "Create, edit and delete roles"),
]
