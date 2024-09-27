#!/bin/bash

# Ensure yq is installed
if ! command -v yq &>/dev/null; then
    echo "yq could not be found, installing..."
    brew install yq
fi

# Ensure the /mnt/secrets directory exists
base_dir="$HOME"

# Ensure the base directory exists
mkdir -p "$base_dir"

yaml_file="charts/vh-video-web/values.yaml"

# Define an array of keys to ignore
ignore_keys=()

# Function to check if a key is in the ignore list
is_ignored() {
    local key=$1
    for ignore_key in "${ignore_keys[@]}"; do
        if [[ "$key" == "$ignore_key" ]]; then
            return 0
        fi
    done
    return 1
}

# Parse the YAML file to extract keys under keyVaults
keys=$(yq e '.java.keyVaults | keys' "$yaml_file")

# Loop through each key and create a directory at $base_dir/secrets/<keyname>
for key in $(echo "$keys" | yq e '.[]' -); do
    dir_path="$base_dir/secrets/$key"
    echo "Creating directory: $dir_path"
    mkdir -p "$dir_path"

    secrets=$(yq e ".java.keyVaults.$key.secrets | keys" "$yaml_file")
    for index in $(echo "$secrets" | yq e '.[]' -); do
        # Extract the secret name for keyvault
        secret_name=$(yq e ".java.keyVaults.$key.secrets[$index]" "$yaml_file")
        # is the entry a string or a name/alias object
        secret_type=$(yq e ".java.keyVaults.$key.secrets[$index] | type" "$yaml_file")
        if [ "$secret_type" == "!!str" ]; then
            # process the string
            if is_ignored "$secret_name"; then
                echo "Ignoring key: $secret_name"
                continue
            fi
            keyvaultValue=$(az keyvault secret show --vault-name "$key-dev" --name "$secret_name" --query value -o tsv)
            file_name="$secret_name"
            file_path="$dir_path/$file_name"
            echo "Creating file: $file_path with content: $keyvaultValue"
            echo "$keyvaultValue" >"$file_path"

        else
            # process the name/alias object
            name=$(echo "$secret_name" | yq e '.name' -)
            alias=$(echo "$secret_name" | yq e '.alias' -)

            # process the pair
            if is_ignored "$name"; then
                echo "Ignoring key: $name"
                continue
            fi

            keyvaultValue=$(az keyvault secret show --vault-name "$key-dev" --name "$name" --query value -o tsv)
            file_name="$alias"
            file_path="$dir_path/$file_name"
            echo "Creating file: $file_path with content: $keyvaultValue"
            echo "$keyvaultValue" >"$file_path"
        fi
    done

done
