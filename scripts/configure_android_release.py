#!/usr/bin/env python3
import os
import sys

def configure_app_gradle():
    app_gradle = 'apps/mobile/android/app/build.gradle'
    if not os.path.exists(app_gradle):
        print(f"Warning: {app_gradle} not found")
        return

    with open(app_gradle, 'r') as f:
        content = f.read()

    # 1. Release signing config
    signing_block = """
        release {
            storeFile file('release.keystore')
            storePassword 'bengalsafetypass'
            keyAlias 'bengalsafety'
            keyPassword 'bengalsafetypass'
        }
"""
    if 'signingConfigs {' in content and 'release {' not in content:
        content = content.replace('signingConfigs {', 'signingConfigs {\n' + signing_block)
        content = content.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release')

    # 2. ABI splits (ARM64 fast APK + Universal APK)
    splits_block = """
    splits {
        abi {
            enable true
            reset()
            include 'arm64-v8a'
            universalApk true
        }
    }
"""
    if 'splits {' not in content:
        content = content.replace('android {', 'android {\n' + splits_block)

    with open(app_gradle, 'w') as f:
        f.write(content)
    print("Successfully configured apps/mobile/android/app/build.gradle")


def configure_root_gradle():
    root_gradle = 'apps/mobile/android/build.gradle'
    if not os.path.exists(root_gradle):
        print(f"Warning: {root_gradle} not found")
        return

    with open(root_gradle, 'r') as f:
        content = f.read()

    # Explicitly enforce Kotlin 1.9.25 for Compose compiler compatibility
    content = content.replace(
        "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
        "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25')"
    )
    content = content.replace(
        'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")',
        "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25')"
    )
    if 'rootProject.ext.kotlinVersion' not in content:
        content = "rootProject.ext.set('kotlinVersion', '1.9.25')\n" + content

    with open(root_gradle, 'w') as f:
        f.write(content)
    print("Successfully configured apps/mobile/android/build.gradle")


def configure_gradle_properties():
    props_path = 'apps/mobile/android/gradle.properties'
    if not os.path.exists(props_path):
        print(f"Warning: {props_path} not found")
        return

    with open(props_path, 'r') as f:
        content = f.read()

    # Increase heap memory from 2048m to 4096m to prevent Java heap space errors
    content = content.replace('-Xmx2048m', '-Xmx4096m')
    content = content.replace('-XX:MaxMetaspaceSize=512m', '-XX:MaxMetaspaceSize=1024m')

    extra = """
kotlinVersion=1.9.25
android.kotlinVersion=1.9.25
android.suppressKotlinVersionCompatibilityCheck=true
kotlin.suppressKotlinVersionCompatibilityCheck=true
"""
    content += extra

    with open(props_path, 'w') as f:
        f.write(content)
    print("Successfully configured apps/mobile/android/gradle.properties")


if __name__ == '__main__':
    configure_app_gradle()
    configure_root_gradle()
    configure_gradle_properties()
