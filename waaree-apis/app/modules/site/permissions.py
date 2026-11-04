from app.core.permissions import Permission

PERMISSIONS = [
    Permission("menu.manage", "Edit the website's main menu links", default_roles=("Admin",)),
    Permission("settings.manage", "Change site-wide settings", default_roles=("Admin",)),
]
