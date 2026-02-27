---
title: 'Building a Production-Grade Homelab with IaC'
description: 'How I built an enterprise-style homelab — VLANs, Proxmox, k3s, and a full GitOps platform, all managed with Terraform and ArgoCD.'
date: 2026-02-27
tags: ['homelab', 'infrastructure', 'terraform', 'kubernetes', 'devops']
draft: true
---

## This Isn't Just a Rack of Gear

I built a homelab. But not the "throw a NAS in a closet and call it a day" kind.

This is a production-grade infrastructure platform — five VLANs, a 10-gigabit storage backbone, a three-node Kubernetes cluster, full GitOps, and an observability stack that would make a startup jealous. Every piece of it is managed with Terraform and ArgoCD. Zero manual configuration. If I can't define it in code, it doesn't exist.

This post is the overview — the "what" and "why." Upcoming posts in this series will tear apart each layer in detail.

## The Hardware

The physical foundation is four devices:

- **Ubiquiti Dream Machine Pro** — Router and firewall. Manages all VLANs, firewall rules, and DHCP. The brain of the network.
- **RealHD SW8-10GSFPMG** — 10G SFP+ managed switch. Handles the VLAN trunks between Proxmox and the NAS at line speed.
- **Proxmox server** — The hypervisor. Dual-NIC: 1G for management, 10G for storage and compute traffic. Runs all VMs.
- **Asustor NAS** — Dual-NIC as well: 1G for Plex and management, 10G on VLAN 20 for NFS storage. Houses ISOs, k3s persistent volumes, and media.

Pi-hole sits on a Raspberry Pi at 192.168.1.4, handling DNS for the entire network. The AmpliFi Router HD runs in bridge mode as a WiFi access point only — all routing and DHCP goes through the UDM Pro.

Nothing fancy on paper. The magic is in how it's all wired together.

## Network Design

Five VLANs keep traffic isolated:

| VLAN | Subnet | Purpose |
|------|--------|---------|
| 1 (Home) | 192.168.1.0/24 | Management, clients, DNS |
| 20 (Storage) | 10.20.20.0/24 | 10G NFS traffic only |
| 30 (Compute) | 10.30.30.0/24 | k3s cluster |
| 40 (IoT) | 10.40.40.0/24 | IoT devices, isolated |
| 50 (Guest) | 10.50.50.0/24 | Guest WiFi, isolated |

The UDM Pro enforces firewall rules between VLANs. Compute can reach the Proxmox API (for monitoring) but nothing else on the home network. IoT and Guest are fully isolated — they get internet and nothing more.

The 10G backbone on VLAN 20 means Proxmox and the NAS communicate at wire speed for NFS operations. VM disk I/O, ISO transfers, and k3s persistent volumes all run over this dedicated storage network. No contention with management or user traffic.

All VLAN and firewall configuration is managed with OpenTofu via the UniFi provider. Every rule is in version control.

## The Platform Stack

Three Ubuntu 24.04 VMs on Proxmox form a k3s cluster on VLAN 30:

- **k3s-cp-0** (10.30.30.10) — Control plane
- **k3s-worker-0** (10.30.30.11) — Worker
- **k3s-worker-1** (10.30.30.12) — Worker

All provisioned via Terraform with cloud-init. One `terragrunt apply` and the cluster exists.

On top of k3s, ArgoCD runs the show using an **app-of-apps** pattern. A single root Application (managed by Terraform) watches a directory in the `homelab-gitops` repo. Drop a YAML file in that directory and ArgoCD deploys it within minutes. The platform components:

- **MetalLB** — L2 load balancer, VIP pool at 10.30.30.200-210
- **Traefik** — Ingress controller with Let's Encrypt wildcard TLS (DNS-01 via Cloudflare)
- **cert-manager** — Automated certificate lifecycle
- **NFS Provisioner** — Dynamic PVs backed by the Asustor NAS over 10G
- **External Secrets Operator + OpenBao** — Secrets from 1Password flow into Kubernetes automatically
- **kube-prometheus-stack** — Prometheus, Grafana, AlertManager
- **Loki + Alloy** — Log aggregation from pods and syslog from every network device
- **Falco** — Runtime security monitoring with eBPF

Every one of these is an ArgoCD Application. No `helm install`. No `kubectl apply`. Git is the source of truth.

## IaC Everything

Two repos drive the entire infrastructure:

**`homelab-live`** contains all Terraform/Terragrunt code — Proxmox VMs, UniFi networks, firewall rules, the ArgoCD bootstrap, and reusable modules. Terragrunt handles environment structure and dependency ordering.

**`homelab-gitops`** holds ArgoCD Application manifests and Helm values. This is what ArgoCD watches. Adding a new platform component means adding a YAML file here — ArgoCD picks it up and deploys.

Secrets follow a strict pipeline: 1Password is the source of truth. External Secrets Operator pulls secrets via a 1Password Service Account and creates Kubernetes Secrets automatically. OpenBao provides internal KV storage for anything that doesn't belong in 1Password. No secrets in git. No manual `kubectl create secret`. Ever.

The result: I can rebuild the entire platform from scratch with `terragrunt run-all apply` and a few minutes of ArgoCD sync time. Every configuration decision is documented in code.

## What's Next

This is post #1 of a seven-part series. Coming up:

1. **Network deep dive** — VLAN design, firewall rules, and 10G architecture
2. **Proxmox + Terraform** — IaC for your hypervisor
3. **k3s on Proxmox** — Lightweight Kubernetes that works
4. **GitOps with ArgoCD** — The app-of-apps pattern
5. **Secrets management** — 1Password, ESO, and OpenBao
6. **Full observability** — Prometheus, Loki, Falco, and AlertManager

Each post will include the actual code, the decisions behind it, and the lessons learned along the way.

If you're building a homelab and want to do it with real IaC — not just clicking through UIs — follow along. The code is open source, the process is documented, and I'm sharing everything.
