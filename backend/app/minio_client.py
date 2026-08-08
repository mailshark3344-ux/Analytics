from minio import Minio


MINIO_ENDPOINT = "localhost:9000"

MINIO_ACCESS_KEY = "minioadmin"

MINIO_SECRET_KEY = "minioadmin123"

BUCKET_NAME = "myfiles"


client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)


bucket_name = BUCKET_NAME


if not client.bucket_exists(bucket_name):

    client.make_bucket(bucket_name)

    print(
        f"Created bucket: {bucket_name}"
    )

else:

    print(
        f"Using bucket: {bucket_name}"
    )