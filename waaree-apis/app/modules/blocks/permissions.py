from app.core.permissions import Permission

PERMISSIONS = [
    Permission(
        "blocks.manage",
        "Create, edit and delete custom blocks in the UI Kit",
        default_roles=("Admin", "Editor"),
    ),
]
