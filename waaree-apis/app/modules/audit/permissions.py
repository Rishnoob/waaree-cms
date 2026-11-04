from app.core.permissions import Permission

PERMISSIONS = [
    Permission("audit.view", "See the audit log and export it", default_roles=("Admin", "Approver")),
]
