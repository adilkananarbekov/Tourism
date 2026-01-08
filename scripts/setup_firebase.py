import argparse
import json
import os
import sys
from typing import Iterable, List, Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore
import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account


def load_seed_data(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError("Seed data must be a JSON array of tours.")
    return data


def init_firestore(service_account_path: str, project_id: str) -> firestore.Client:
    try:
        firebase_admin.get_app()
        return firestore.client()
    except ValueError:
        pass

    if service_account_path:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred, {"projectId": project_id} if project_id else None)
    else:
        firebase_admin.initialize_app()
    return firestore.client()


def batch_write_tours(db: firestore.Client, tours: Iterable[Dict[str, Any]]) -> None:
    batch = db.batch()
    batch_size = 0

    for tour in tours:
        if "id" not in tour:
            raise ValueError("Each tour must include an 'id' field.")

        tour_id = int(tour["id"])
        tour["id"] = tour_id
        doc_ref = db.collection("tours").document(str(tour_id))
        batch.set(doc_ref, tour)
        batch_size += 1

        if batch_size >= 400:
            batch.commit()
            batch = db.batch()
            batch_size = 0

    if batch_size:
        batch.commit()


def read_rules(path: str) -> str:
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def get_access_token(service_account_path: str) -> str:
    creds = service_account.Credentials.from_service_account_file(
        service_account_path,
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    creds.refresh(Request())
    if not creds.token:
        raise RuntimeError("Unable to obtain access token.")
    return creds.token


def deploy_rules(project_id: str, rules_content: str, access_token: str) -> None:
    base_url = f"https://firebaserules.googleapis.com/v1/projects/{project_id}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    ruleset_response = requests.post(
        f"{base_url}/rulesets",
        headers=headers,
        json={
            "source": {
                "files": [
                    {
                        "name": "firestore.rules",
                        "content": rules_content,
                    }
                ]
            }
        },
        timeout=30,
    )
    ruleset_response.raise_for_status()
    ruleset_name = ruleset_response.json()["name"]

    release_response = requests.patch(
        f"{base_url}/releases/cloud.firestore?updateMask=rulesetName",
        headers=headers,
        json={
            "release": {
                "name": f"{base_url}/releases/cloud.firestore",
                "rulesetName": ruleset_name,
            }
        },
        timeout=30,
    )
    release_response.raise_for_status()


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed Firestore tours and apply rules.")
    parser.add_argument("--project-id", required=True, help="Firebase project ID.")
    parser.add_argument(
        "--service-account",
        required=True,
        help="Path to the Firebase service account JSON file.",
    )
    parser.add_argument(
        "--seed-file",
        default=os.path.join("data", "seed_tours.json"),
        help="Path to the seed tours JSON file.",
    )
    parser.add_argument(
        "--rules-file",
        default="firestore.rules",
        help="Path to the Firestore rules file.",
    )
    parser.add_argument(
        "--skip-seed",
        action="store_true",
        help="Skip seeding the tours collection.",
    )
    parser.add_argument(
        "--apply-rules",
        action="store_true",
        help="Deploy Firestore rules via the Rules API.",
    )

    args = parser.parse_args()

    if not args.skip_seed:
        tours = load_seed_data(args.seed_file)
        db = init_firestore(args.service_account, args.project_id)
        batch_write_tours(db, tours)
        print(f"Seeded {len(tours)} tours into Firestore.")

    if args.apply_rules:
        rules_content = read_rules(args.rules_file)
        token = get_access_token(args.service_account)
        deploy_rules(args.project_id, rules_content, token)
        print("Firestore rules deployed.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
