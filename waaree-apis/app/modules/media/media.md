# media module

Media library: `GET/POST /media`, `DELETE /media/{id}`, public `GET /media/files/{name}`.
Storage is swappable (`storage.py`): a local folder now, S3 when the bucket exists (`MEDIA_STORAGE=s3`).
Allowed: images, PDF, MP4/WebM, up to `MEDIA_MAX_MB`. Permissions: `media.view`, `media.upload`.
