from app.core.permissions import Permission

PERMISSIONS = [
    Permission("users.view", "See the list of CMS users", default_roles=("Admin",)),
    Permission("users.manage", "Add users, change their roles, deactivate them and reset passwords"),
]
