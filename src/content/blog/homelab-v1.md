---
title: 'Building a Production-Grade Homelab with AI and IaC'
description: 'How I built an enterprise-style homelab with Claude Code as my AI co-pilot — VLANs, Proxmox, k3s, and a full GitOps platform, all managed with Terraform and ArgoCD.'
date: 2026-02-27
tags: ['homelab', 'infrastructure', 'terraform', 'kubernetes', 'devops', 'ai', 'claude', 'open-source', 'cncf']
draft: true
---

## This Isn't Just a Rack of Gear

I built a homelab. But not the "throw a NAS in a closet and call it a day" kind.

This is a production-grade infrastructure platform — five VLANs, a 10-gigabit storage backbone, a three-node Kubernetes cluster, full GitOps, and an observability stack that would make a startup jealous. Built entirely on open-source and CNCF projects. Managed entirely with Infrastructure as Code. Zero vendor lock-in. Zero manual configuration. If I can't define it in code, it doesn't exist.

Oh, and my pair programmer for the entire build? [Claude Code](https://claude.ai/claude-code) — Anthropic's AI coding agent. I broke the project into 10 phases across 30 GitHub issues, and Claude Code helped me ship every single one in under a week. More on that later.

The code is on GitHub. The orchestration repo — `homelab-live` — is private by design. It contains Terragrunt configurations, environment-specific variables, and references to secrets. That's where the project lives and where all 30 issues were tracked. But the reusable pieces are all public: [homelab-gitops](https://github.com/n2solutionsio/homelab-gitops) has every ArgoCD manifest and Helm values file, and the Terraform modules — [terraform-proxmox-vm](https://github.com/n2solutionsio/terraform-proxmox-vm), [terraform-proxmox-k3s](https://github.com/n2solutionsio/terraform-proxmox-k3s), and [terraform-proxmox-network](https://github.com/n2solutionsio/terraform-proxmox-network) — are fully open source. You get the patterns and the code without my IP addresses and secrets.

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

A deliberate choice here: **every tool in this stack is open source.** OpenTofu over Terraform Cloud. OpenBao over HashiCorp Vault. Proxmox over VMware. k3s over managed Kubernetes. ArgoCD, Falco, cert-manager, and MetalLB are all CNCF projects. Grafana, Loki, Alloy, and Prometheus are open-source Grafana Labs projects. The entire platform runs without a single commercial license or SaaS dependency. If a project gets acquired or changes its license tomorrow, I'm not locked in.

## IaC Everything

Two repos drive the entire infrastructure:

**`homelab-live`** contains all OpenTofu/Terragrunt code — Proxmox VMs, UniFi networks, firewall rules, the ArgoCD bootstrap, and reusable modules. OpenTofu (the open-source Terraform fork) keeps the IaC layer free from BSL licensing concerns. Terragrunt handles environment structure and dependency ordering.

**`homelab-gitops`** holds ArgoCD Application manifests and Helm values. This is what ArgoCD watches. Adding a new platform component means adding a YAML file here — ArgoCD picks it up and deploys.

Secrets follow a strict pipeline: 1Password is the source of truth. External Secrets Operator pulls secrets via a 1Password Service Account and creates Kubernetes Secrets automatically. OpenBao provides internal KV storage for anything that doesn't belong in 1Password. No secrets in git. No manual `kubectl create secret`. Ever.

The result: I can rebuild the entire platform from scratch with `terragrunt run-all apply` and a few minutes of ArgoCD sync time. Every configuration decision is documented in code.

## Breaking It Down: GitHub Issues as the Backbone

Before writing a single line of Terraform, I broke the entire project into 10 phases and 30 GitHub issues. Each issue was scoped to a single deliverable — "Configure Proxmox VLAN trunk," "Deploy ArgoCD app-of-apps," "Enable AlertManager with Slack notifications." No epics that take a month. No vague tickets. Every issue had clear acceptance criteria and fit into a phase.

The phases built on each other:

1. **Foundation** — State backend
2. **Physical network** — Switch config, bridge mode
3. **Logical network** — VLANs, firewall rules
4. **Hypervisor** — Proxmox networking and storage
5. *(backlogged)*
6. **Compute** — k3s cluster
7. **GitOps + monitoring** — ArgoCD, Prometheus, Grafana
8. **Logging + security** — Loki, Alloy, Falco
9. **TLS** — Let's Encrypt wildcard certs
10. **Alerting** — AlertManager + Slack

This structure was critical. It turned a massive project into a checklist. Each issue got its own branch, its own PR, its own commit history. When something broke, I knew exactly which phase introduced it. When I picked the project back up after a break, I knew exactly where I left off.

If you're planning a homelab build — or any infrastructure project — start with the issue tracker. The code writes itself once the scope is clear.

## The AI Co-Pilot

Here's the part that surprised me: I built this entire platform with Claude Code as my pair programmer. Not as a chatbot I copy-pasted from — as an actual CLI agent running in my terminal, reading my codebase, writing Terraform modules, and executing commands.

Claude Code worked directly against the GitHub issues. I'd open an issue, describe what I needed, and we'd work through it together — often closing multiple issues in a single session. What that looked like in practice:

- **Terraform authoring** — Claude Code wrote the Terragrunt modules for Proxmox VMs, UniFi VLANs, firewall rules, and the k3s cluster. It understood provider quirks (like the UniFi API's race condition with firewall rule indexes) and worked through them.
- **MCP integrations** — I connected Claude Code to my infrastructure via Model Context Protocol servers — Proxmox, UniFi, and Terraform Registry. It could query my actual switch ports, VM states, and network topology in real-time while writing code against them.
- **Debugging** — When cloud-init VMs collided on hostnames, when NFS mounts failed because Ubuntu 24.04 doesn't ship `nfs-common`, when Loki's replication factor broke with a single replica — Claude Code diagnosed and fixed these without me having to dig through docs.
- **GitOps pipeline** — Every ArgoCD Application manifest, Helm values file, and ExternalSecret was authored collaboratively. Claude Code maintained context across sessions using its memory system — it knew the full architecture, every IP address, every lesson learned.
- **Issue management** — Claude Code created issues, closed them with commits, and tracked what was done vs. what was next. The GitHub project board stayed current without me manually updating it.

The velocity was unreal. Ten phases of infrastructure — networking, compute, GitOps, secrets, observability, security, TLS, alerting — all 30 issues closed in under a week. That's not a testament to my typing speed. It's what happens when you combine clear issue scoping with an AI agent that understands your codebase and can operate autonomously within it.

I'll write a dedicated post about the Claude Code workflow, but the short version: if you're doing IaC work and you're not using an AI coding agent, you're leaving 10x on the table.

## What's Next

This is post #1 of an eight-part series. Coming up:

1. **Network deep dive** — VLAN design, firewall rules, and 10G architecture
2. **Proxmox + Terraform** — IaC for your hypervisor
3. **k3s on Proxmox** — Lightweight Kubernetes that works
4. **GitOps with ArgoCD** — The app-of-apps pattern
5. **Secrets management** — 1Password, ESO, and OpenBao
6. **Full observability** — Prometheus, Loki, Falco, and AlertManager
7. **AI-driven IaC** — How Claude Code built the entire platform

Each post will include the actual code, the decisions behind it, and the lessons learned along the way.

If you're building a homelab and want to do it with real IaC and real open-source tooling — not clicking through UIs or paying for licenses — follow along. Whether you're here for the infrastructure, the CNCF stack, the AI workflow, or all of the above, the code is open source, the process is documented, and I'm sharing everything.
