from app.core.permissions import Permission

PERMISSIONS = [
    Permission("media.view", "Browse the media library", default_roles=("Admin", "Editor", "Approver")),
    Permission("media.upload", "Upload and delete files", default_roles=("Admin", "Editor")),
]
