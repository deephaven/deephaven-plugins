import shutil
import os
import subprocess
import tarfile

__all__ = ["package_js"]


def package_js(js_dir: str, dest_dir: str) -> None:
    """
    Package the built JS files at the given JS directory and unpack them into the destination directory.

    Args:
        js_dir:
            The directory containing the JS files
        dest_dir:
            The directory to unpack the JS files into
    """
    dist_dir = os.path.join(js_dir, "dist")
    build_dir = os.path.join(js_dir, "build")
    package_dir = os.path.join(build_dir, "package")

    # copy the bundle to the directory
    # the path may not exist (e.g. when running tests)
    # so it is not strictly necessary to copy the bundle
    if os.path.exists(dist_dir):
        # ignore errors as the directory may not exist
        shutil.rmtree(build_dir, ignore_errors=True)
        shutil.rmtree(dest_dir, ignore_errors=True)

        os.makedirs(build_dir, exist_ok=True)

        # on Windows npm is npm.cmd, which subprocess can't find by bare name
        npm = shutil.which("npm")
        if npm is None:
            raise FileNotFoundError("Unable to find npm on PATH")

        # pack and unpack into the js directory
        subprocess.run(
            [npm, "pack", "--pack-destination", "build"], cwd=js_dir, check=True
        )
        # it is assumed that there is only one tarball in the directory
        files = os.listdir(build_dir)
        for file in files:
            file_path = os.path.join(build_dir, file)
            with tarfile.open(file_path, "r:gz") as tar:
                if hasattr(tarfile, "data_filter"):
                    tar.extractall(build_dir, filter="data")
                else:
                    tar.extractall(build_dir)
            os.remove(file_path)

        # move the package directory to the expected package location
        shutil.move(package_dir, dest_dir)
