"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CreateResume from "./CreateResume";
import CreateCoverLetter from "./CreateCoverLetter";
import CreateSiteProfile from "./CreateSiteProfile";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getResumeList } from "@/actions/profile.actions";
import { getCoverLetterList } from "@/actions/coverLetter.actions";
import { getSiteProfileList } from "@/actions/siteProfile.actions";
import {
  listJobBidders,
  type JobBidderSummary,
} from "@/actions/site-admin.actions";
import {
  CoverLetter,
  ProfileDocument,
  Resume,
  SiteProfile,
} from "@/models/profile.model";
import { APP_CONSTANTS } from "@/lib/constants";
import Loading from "../Loading";
import DocumentTable from "./ResumeTable";
import { toast } from "../ui/use-toast";
import { ChevronDown, PlusCircle } from "lucide-react";
import { Button } from "../ui/button";
import { RecordsPerPageSelector } from "../RecordsPerPageSelector";
import { RecordsCount } from "../RecordsCount";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ProfileSubjectProvider } from "./ProfileSubjectContext";

type ProfileContainerProps = {
  isAdmin?: boolean;
};

const ProfileContainer = ({ isAdmin = false }: ProfileContainerProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subjectUserId = isAdmin
    ? searchParams.get("userId") ?? undefined
    : undefined;

  const [users, setUsers] = useState<JobBidderSummary[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [siteProfiles, setSiteProfiles] = useState<SiteProfile[]>([]);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [coverLetterDialogOpen, setCoverLetterDialogOpen] = useState(false);
  const [siteProfileDialogOpen, setSiteProfileDialogOpen] = useState(false);

  const [resumeToEdit, setResumeToEdit] = useState<Resume | null>(null);
  const [coverLetterToEdit, setCoverLetterToEdit] =
    useState<CoverLetter | null>(null);
  const [siteProfileToEdit, setSiteProfileToEdit] =
    useState<SiteProfile | null>(null);
  const [totalResumes, setTotalResumes] = useState<number>(0);
  const [totalCoverLetters, setTotalCoverLetters] = useState<number>(0);
  const [totalSiteProfiles, setTotalSiteProfiles] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [recordsPerPage, setRecordsPerPage] = useState<number>(
    APP_CONSTANTS.RECORDS_PER_PAGE,
  );

  const selectedUser = users.find((u) => u.id === subjectUserId);

  useEffect(() => {
    if (!isAdmin) return;

    listJobBidders()
      .then(setUsers)
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Error!",
          description: "Failed to load users.",
        });
      });
  }, [isAdmin]);

  const onUserChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "self") {
      params.delete("userId");
    } else {
      params.set("userId", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const loadResumes = useCallback(
    async (page: number) => {
      const { data, total, success, message } = await getResumeList(
        page,
        recordsPerPage,
        subjectUserId,
      );
      if (success && data) {
        setResumes((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotalResumes(total);
        setPage(page);
      } else {
        toast({
          variant: "destructive",
          title: "Error!",
          description: message,
        });
      }
    },
    [recordsPerPage, subjectUserId],
  );

  const loadCoverLetters = useCallback(async () => {
    const { data, total, success, message } = await getCoverLetterList(
      1,
      100,
      subjectUserId,
    );
    if (success && data) {
      setCoverLetters(data);
      setTotalCoverLetters(total);
    } else {
      toast({
        variant: "destructive",
        title: "Error!",
        description: message,
      });
    }
  }, [subjectUserId]);

  const loadSiteProfiles = useCallback(async () => {
    const { data, total, success, message } = await getSiteProfileList(
      1,
      100,
      subjectUserId,
    );
    if (success && data) {
      setSiteProfiles(data);
      setTotalSiteProfiles(total);
    } else {
      toast({
        variant: "destructive",
        title: "Error!",
        description: message,
      });
    }
  }, [subjectUserId]);

  const loadDocuments = useCallback(
    async (page: number) => {
      setLoading(true);
      await Promise.all([
        loadResumes(page),
        loadCoverLetters(),
        loadSiteProfiles(),
      ]);
      setLoading(false);
    },
    [loadResumes, loadCoverLetters, loadSiteProfiles],
  );

  const reloadDocuments = useCallback(async () => {
    await loadDocuments(1);
  }, [loadDocuments]);

  useEffect(() => {
    (async () => await loadDocuments(1))();
  }, [loadDocuments, recordsPerPage]);

  const documents: ProfileDocument[] = useMemo(() => {
    const resumeDocs: ProfileDocument[] = resumes.map((r) => ({
      id: r.id!,
      title: r.title,
      type: "resume" as const,
      createdAt: r.createdAt!,
      updatedAt: r.updatedAt!,
      jobCount: r._count?.Job ?? 0,
      FileId: r.FileId,
    }));
    const coverLetterDocs: ProfileDocument[] = coverLetters.map((cl) => ({
      id: cl.id!,
      title: cl.title,
      type: "cover-letter" as const,
      createdAt: cl.createdAt!,
      updatedAt: cl.updatedAt!,
      jobCount: cl._count?.Job ?? 0,
      content: cl.content,
    }));
    const siteProfileDocs: ProfileDocument[] = siteProfiles.map((sp) => ({
      id: sp.id!,
      title: sp.accountName,
      type: "site-profile" as const,
      createdAt: sp.createdAt!,
      updatedAt: sp.updatedAt!,
      jobCount: 0,
      siteUrl: sp.siteUrl,
      email: sp.email,
    }));
    return [...resumeDocs, ...coverLetterDocs, ...siteProfileDocs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [resumes, coverLetters, siteProfiles]);

  const totalDocuments = totalResumes + totalCoverLetters + totalSiteProfiles;

  const createResume = () => {
    setResumeToEdit(null);
    setResumeDialogOpen(true);
  };

  const createCoverLetter = () => {
    setCoverLetterToEdit(null);
    setCoverLetterDialogOpen(true);
  };

  const createSiteProfile = () => {
    setSiteProfileToEdit(null);
    setSiteProfileDialogOpen(true);
  };

  const onEditResume = (doc: ProfileDocument) => {
    setResumeToEdit({
      id: doc.id,
      title: doc.title,
      FileId: doc.FileId,
    });
    setResumeDialogOpen(true);
  };

  const onEditCoverLetter = (doc: ProfileDocument) => {
    setCoverLetterToEdit({
      id: doc.id,
      title: doc.title,
      content: doc.content ?? "",
    });
    setCoverLetterDialogOpen(true);
  };

  const onEditSiteProfile = (doc: ProfileDocument) => {
    setSiteProfileToEdit({
      id: doc.id,
      siteUrl: doc.siteUrl ?? "",
      accountName: doc.title,
      email: doc.email ?? "",
    });
    setSiteProfileDialogOpen(true);
  };

  const setResumeId = (id: string) => {};

  return (
    <ProfileSubjectProvider subjectUserId={subjectUserId}>
      <Card>
        <CardHeader className="flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="space-y-1">
              <CardTitle>Profile</CardTitle>
              {isAdmin && subjectUserId && selectedUser ? (
                <p className="text-sm text-muted-foreground">
                  Managing profile for {selectedUser.name}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <Select
                  value={subjectUserId ?? "self"}
                  onValueChange={onUserChange}
                >
                  <SelectTrigger
                    className="h-8 w-[200px]"
                    aria-label="Select user profile"
                  >
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>User</SelectLabel>
                      <SelectItem value="self">My profile</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      New
                    </span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={createResume}
                  >
                    Add New Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={createCoverLetter}
                  >
                    Add New Cover Letter
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={createSiteProfile}
                  >
                    Add New Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <CreateResume
                resumeDialogOpen={resumeDialogOpen}
                setResumeDialogOpen={setResumeDialogOpen}
                reloadResumes={reloadDocuments}
                resumeToEdit={resumeToEdit}
                setNewResumeId={setResumeId}
                subjectUserId={subjectUserId}
              />
              <CreateCoverLetter
                dialogOpen={coverLetterDialogOpen}
                setDialogOpen={setCoverLetterDialogOpen}
                coverLetterToEdit={coverLetterToEdit}
                reloadDocuments={reloadDocuments}
                subjectUserId={subjectUserId}
              />
              <CreateSiteProfile
                dialogOpen={siteProfileDialogOpen}
                setDialogOpen={setSiteProfileDialogOpen}
                siteProfileToEdit={siteProfileToEdit}
                reloadDocuments={reloadDocuments}
                subjectUserId={subjectUserId}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <Loading />}
          {documents.length > 0 && (
            <>
              <DocumentTable
                documents={documents}
                editResume={onEditResume}
                editCoverLetter={onEditCoverLetter}
                editSiteProfile={onEditSiteProfile}
                reloadDocuments={reloadDocuments}
                subjectUserId={subjectUserId}
              />
              <div className="flex items-center justify-between mt-4">
                <RecordsCount
                  count={documents.length}
                  total={totalDocuments}
                  label="documents"
                />
                {totalDocuments > APP_CONSTANTS.RECORDS_PER_PAGE && (
                  <RecordsPerPageSelector
                    value={recordsPerPage}
                    onChange={setRecordsPerPage}
                  />
                )}
              </div>
            </>
          )}
          {!loading && documents.length === 0 && (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          )}
          {resumes.length < totalResumes && (
            <div className="flex justify-center p-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadDocuments(page + 1)}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </ProfileSubjectProvider>
  );
};

export default ProfileContainer;
